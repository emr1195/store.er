import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["create", "createIfNotExists", "patch", "set"]) chain[name] = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return {
    auth: vi.fn(),
    currentUser: vi.fn(),
    fetch: vi.fn(),
    transaction: vi.fn(() => chain),
    patch: vi.fn(() => chain),
    chain,
    customerList: vi.fn(),
    sessionCreate: vi.fn(),
    sessionRetrieve: vi.fn(),
    products: [] as Array<Record<string, unknown>>,
    availability: null as Array<Record<string, unknown>> | null,
    existingOrders: [] as Array<Record<string, unknown> | null>,
    releaseOrder: { _rev: "order-r1", inventoryReserved: true } as Record<string, unknown> | null,
  };
});

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth, currentUser: mocks.currentUser }));
vi.mock("@/sanity/lib/backendClient", () => ({
  backendClient: { fetch: mocks.fetch, transaction: mocks.transaction, patch: mocks.patch },
}));
vi.mock("@/lib/stripe", () => ({ default: {
  customers: { list: mocks.customerList },
  checkout: { sessions: { create: mocks.sessionCreate, retrieve: mocks.sessionRetrieve } },
} }));

import { createCheckoutSession } from "./createCheckoutSession";

const attemptId = "11111111-1111-4111-8111-111111111111";
const request = (quantity = 1) => ({ items: [{ productId: "p1", quantity }], attemptId });

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_ITBMS_RATE = "0.07";
    process.env.NEXT_PUBLIC_STANDARD_SHIPPING_CENTS = "0";
    mocks.products = [{ _id: "p1", _rev: "r1", name: "Producto", price: 10, stock: 5, isActive: true }];
    mocks.availability = null;
    mocks.existingOrders = [null];
    mocks.releaseOrder = { _rev: "order-r1", inventoryReserved: true };
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.currentUser.mockResolvedValue({
      fullName: "Cliente",
      firstName: "Cliente",
      primaryEmailAddress: { emailAddress: "client@example.com" },
    });
    mocks.fetch.mockImplementation((query: string) => {
      if (query.includes("stripeCheckoutSessionId")) return Promise.resolve(mocks.existingOrders.shift() ?? null);
      if (query.includes("{_rev,inventoryReserved}")) return Promise.resolve(mocks.releaseOrder);
      if (query.includes("{_id,stock}")) return Promise.resolve((mocks.availability ?? mocks.products).map(({ _id, stock }) => ({ _id, stock })));
      if (query.includes("_id in $ids")) return Promise.resolve(mocks.products);
      return Promise.resolve(null);
    });
    mocks.chain.commit.mockResolvedValue({});
    mocks.customerList.mockResolvedValue({ data: [] });
    mocks.sessionCreate.mockResolvedValue({ id: "cs_1", url: "https://checkout.test", customer: null });
    mocks.sessionRetrieve.mockResolvedValue({ id: "cs_1", url: "https://checkout.test", status: "open" });
  });

  it("devuelve UNAUTHORIZED sin lanzar para usuarios no autenticados", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(createCheckoutSession(request())).resolves.toMatchObject({ success: false, code: "UNAUTHORIZED" });
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("reserva stock y crea checkout con el precio consultado en el servidor", async () => {
    const result = await createCheckoutSession({ ...request(), items: [{ productId: "p1", quantity: 1, price: 0.01 }] } as never);
    expect(result).toEqual({ success: true, checkoutUrl: "https://checkout.test", orderId: `order.${attemptId}` });
    const payload = mocks.sessionCreate.mock.calls[0][0];
    expect(payload.line_items[0].price_data.unit_amount).toBe(1000);
    expect(payload.line_items[1].price_data.unit_amount).toBe(70);
    expect(mocks.sessionCreate.mock.calls[0][1]).toEqual({ idempotencyKey: `checkout:order.${attemptId}` });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("devuelve STOCK_CHANGED con el stock real cuando es insuficiente", async () => {
    const result = await createCheckoutSession(request(6));
    expect(result).toMatchObject({ success: false, code: "STOCK_CHANGED", inventory: [{ productId: "p1", availableQuantity: 5 }] });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("devuelve INVALID_CART para cantidades inválidas y EMPTY_CART para carrito vacío", async () => {
    await expect(createCheckoutSession(request(-1))).resolves.toMatchObject({ success: false, code: "INVALID_CART" });
    await expect(createCheckoutSession({ items: [], attemptId })).resolves.toMatchObject({ success: false, code: "EMPTY_CART" });
  });

  it("rechaza un producto inactivo antes de reservar", async () => {
    mocks.products[0].isActive = false;
    await expect(createCheckoutSession(request())).resolves.toMatchObject({ success: false, code: "INVALID_CART" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("convierte un conflicto atómico de revisión en STOCK_CHANGED sin crear pago", async () => {
    mocks.availability = [{ _id: "p1", stock: 0 }];
    mocks.existingOrders = [null, null];
    mocks.chain.commit.mockRejectedValueOnce({ statusCode: 409 });
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: false, code: "STOCK_CHANGED", inventory: [{ productId: "p1", availableQuantity: 0 }] });
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
    expect(mocks.patch).not.toHaveBeenCalled();
  });

  it("reutiliza una sesión abierta para el mismo intento sin reservar otra vez", async () => {
    mocks.existingOrders = [{ _id: `order.${attemptId}`, clerkUserId: "user_1", status: "payment_pending", stripeCheckoutSessionId: "cs_1" }];
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: true, checkoutUrl: "https://checkout.test" });
    expect(mocks.sessionRetrieve).toHaveBeenCalledWith("cs_1");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("evita un segundo checkout mientras el primero sigue preparando el pago", async () => {
    mocks.existingOrders = [{ _id: `order.${attemptId}`, clerkUserId: "user_1", status: "pending" }];
    await expect(createCheckoutSession(request())).resolves.toMatchObject({ success: false, code: "CHECKOUT_IN_PROGRESS" });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("dos intentos simultáneos para la última unidad crean una sola sesión de pago", async () => {
    mocks.products[0].stock = 1;
    mocks.availability = [{ _id: "p1", stock: 0 }];
    mocks.existingOrders = [null, null, null];
    let commitCall = 0;
    mocks.chain.commit.mockImplementation(() => {
      commitCall += 1;
      return commitCall === 2 ? Promise.reject({ statusCode: 409 }) : Promise.resolve({});
    });

    const results = await Promise.all([createCheckoutSession(request()), createCheckoutSession(request())]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(results.filter((result) => !result.success && result.code === "STOCK_CHANGED")).toHaveLength(1);
    expect(mocks.sessionCreate).toHaveBeenCalledTimes(1);
  });

  it("libera la reserva y devuelve un mensaje seguro cuando Stripe falla", async () => {
    mocks.sessionCreate.mockRejectedValue(new Error("network secret detail"));
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: false, code: "CHECKOUT_FAILED" });
    expect(result).not.toHaveProperty("stack");
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.chain.create).toHaveBeenCalledWith(expect.objectContaining({ reason: "checkout_failed_release" }));
  });

  it("un error inesperado devuelve una respuesta genérica segura", async () => {
    mocks.fetch.mockRejectedValueOnce(new Error("database connection secret"));
    const result = await createCheckoutSession(request());
    expect(result).toEqual({ success: false, code: "CHECKOUT_FAILED", message: "No pudimos iniciar el pago. Inténtalo nuevamente en unos momentos." });
  });
});
