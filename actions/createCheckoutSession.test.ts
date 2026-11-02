import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["create", "createIfNotExists", "patch", "set"]) chain[name] = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return {
    getServerSession: vi.fn(),
    fetch: vi.fn(),
    transaction: vi.fn(() => chain),
    patch: vi.fn(() => chain),
    chain,
    customerList: vi.fn(),
    sessionCreate: vi.fn(),
    sessionRetrieve: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    loggerError: vi.fn(),
    getExistingCheckout: vi.fn(),
    fetchProductsForCheckout: vi.fn(),
    loadInventoryAvailability: vi.fn(),
    reserveInventoryAndCreateOrder: vi.fn(),
    linkCheckoutSession: vi.fn(),
    releaseCheckoutReservation: vi.fn(),
    products: [] as Array<Record<string, unknown>>,
    availability: null as Array<Record<string, unknown>> | null,
    existingOrders: [] as Array<Record<string, unknown> | null>,
    releaseOrder: { _rev: "order-r1", inventoryReserved: true } as Record<string, unknown> | null,
  };
});

vi.mock("@/lib/auth-session", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/neon/commerce", () => ({
  getExistingCheckout: mocks.getExistingCheckout,
  fetchProductsForCheckout: mocks.fetchProductsForCheckout,
  loadInventoryAvailability: mocks.loadInventoryAvailability,
  reserveInventoryAndCreateOrder: mocks.reserveInventoryAndCreateOrder,
  linkCheckoutSession: mocks.linkCheckoutSession,
  releaseCheckoutReservation: mocks.releaseCheckoutReservation,
}));
vi.mock("@/lib/stripe", () => ({ default: {
  customers: { list: mocks.customerList },
  checkout: { sessions: { create: mocks.sessionCreate, retrieve: mocks.sessionRetrieve } },
} }));
vi.mock("@/lib/logger", () => ({ logger: {
  info: mocks.loggerInfo,
  warn: mocks.loggerWarn,
  error: mocks.loggerError,
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
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
    mocks.products = [{ _id: "p1", _rev: "r1", name: "Producto", price: 10, stock: 5, isActive: true }];
    mocks.availability = null;
    mocks.existingOrders = [null];
    mocks.releaseOrder = { _rev: "order-r1", inventoryReserved: true };
    mocks.getServerSession.mockResolvedValue({
      user: { id: "user_1", name: "Cliente", email: "client@example.com", role: "user" },
      session: { id: "session_1" },
    });
    mocks.getExistingCheckout.mockImplementation(() => Promise.resolve(mocks.existingOrders.shift() ?? null));
    mocks.fetchProductsForCheckout.mockImplementation(() => Promise.resolve(mocks.products));
    mocks.loadInventoryAvailability.mockImplementation(() => Promise.resolve((mocks.availability ?? mocks.products).map(({ _id, stock }) => ({ productId: _id, availableQuantity: stock }))));
    mocks.reserveInventoryAndCreateOrder.mockResolvedValue(undefined);
    mocks.linkCheckoutSession.mockResolvedValue(undefined);
    mocks.releaseCheckoutReservation.mockResolvedValue(undefined);
    mocks.chain.commit.mockResolvedValue({});
    mocks.customerList.mockResolvedValue({ data: [] });
    mocks.sessionCreate.mockResolvedValue({ id: "cs_1", url: "https://checkout.test", customer: null });
    mocks.sessionRetrieve.mockResolvedValue({ id: "cs_1", url: "https://checkout.test", status: "open" });
  });

  it("devuelve UNAUTHORIZED sin lanzar para usuarios no autenticados", async () => {
    mocks.getServerSession.mockResolvedValue(null);
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
    expect(mocks.reserveInventoryAndCreateOrder).toHaveBeenCalledTimes(1);
  });

  it("omite descripciones vacías del payload enviado a Stripe", async () => {
    mocks.products[0].description = "   ";

    const result = await createCheckoutSession(request());

    expect(result).toMatchObject({ success: true });
    const payload = mocks.sessionCreate.mock.calls[0][0];
    expect(payload.line_items[0].price_data.product_data).not.toHaveProperty("description");
  });

  it("normaliza una descripción válida antes de enviarla a Stripe", async () => {
    mocks.products[0].description = "  Producto oficial  ";

    await createCheckoutSession(request());

    const payload = mocks.sessionCreate.mock.calls[0][0];
    expect(payload.line_items[0].price_data.product_data.description).toBe("Producto oficial");
  });

  it("devuelve STOCK_CHANGED con el stock real cuando es insuficiente", async () => {
    const result = await createCheckoutSession(request(6));
    expect(result).toMatchObject({ success: false, code: "STOCK_CHANGED", inventory: [{ productId: "p1", availableQuantity: 5 }] });
    expect(mocks.reserveInventoryAndCreateOrder).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("devuelve INVALID_CART para cantidades inválidas y EMPTY_CART para carrito vacío", async () => {
    await expect(createCheckoutSession(request(-1))).resolves.toMatchObject({ success: false, code: "INVALID_CART" });
    await expect(createCheckoutSession({ items: [], attemptId })).resolves.toMatchObject({ success: false, code: "EMPTY_CART" });
  });

  it("rechaza un producto inactivo antes de reservar", async () => {
    mocks.products[0].isActive = false;
    await expect(createCheckoutSession(request())).resolves.toMatchObject({ success: false, code: "INVALID_CART" });
    expect(mocks.reserveInventoryAndCreateOrder).not.toHaveBeenCalled();
  });

  it("trata un descuento inválido del catálogo como INVALID_CART", async () => {
    mocks.products[0].discount = 101;
    await expect(createCheckoutSession(request())).resolves.toMatchObject({ success: false, code: "INVALID_CART" });
    expect(mocks.reserveInventoryAndCreateOrder).not.toHaveBeenCalled();
    expect(mocks.loggerError).not.toHaveBeenCalledWith("checkout_unexpected_error", expect.anything());
  });

  it("registra la etapa y un código seguro si Neon no está disponible", async () => {
    mocks.reserveInventoryAndCreateOrder.mockRejectedValueOnce(Object.assign(new Error("DATABASE_URL no está configurada"), { code: "DATABASE_URL_MISSING" }));
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: false, code: "STOCK_CHANGED" });
    expect(mocks.loggerError).toHaveBeenCalledWith("checkout_reservation_failed", expect.objectContaining({
      stage: "reserving_inventory",
      errorName: "Error",
      errorCode: "DATABASE_URL_MISSING",
    }));
  });

  it("convierte un conflicto atómico de revisión en STOCK_CHANGED sin crear pago", async () => {
    mocks.availability = [{ _id: "p1", stock: 0 }];
    mocks.existingOrders = [null, null];
    const conflict = Object.assign(new Error("STOCK_CHANGED"), { inventory: [{ productId: "p1", availableQuantity: 0 }] });
    mocks.reserveInventoryAndCreateOrder.mockRejectedValueOnce(conflict);
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: false, code: "STOCK_CHANGED", inventory: [{ productId: "p1", availableQuantity: 0 }] });
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
    expect(mocks.linkCheckoutSession).not.toHaveBeenCalled();
  });

  it("conserva los detalles seguros de un rechazo de Neon durante la reserva", async () => {
    mocks.reserveInventoryAndCreateOrder.mockRejectedValueOnce({
      name: "ClientError",
      message: "Insufficient permissions for mutation",
      code: "42501",
    });
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: false, code: "STOCK_CHANGED" });
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
    expect(mocks.loggerError).toHaveBeenCalledWith("checkout_reservation_failed", expect.objectContaining({
      stage: "reserving_inventory",
      errorName: "ClientError",
      errorMessage: "Insufficient permissions for mutation",
      errorCode: "42501",
    }));
  });

  it("reutiliza una sesión abierta para el mismo intento sin reservar otra vez", async () => {
    mocks.existingOrders = [{ _id: `order.${attemptId}`, clerkUserId: "user_1", status: "payment_pending", stripeCheckoutSessionId: "cs_1" }];
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: true, checkoutUrl: "https://checkout.test" });
    expect(mocks.sessionRetrieve).toHaveBeenCalledWith("cs_1");
    expect(mocks.reserveInventoryAndCreateOrder).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("evita un segundo checkout mientras el primero sigue preparando el pago", async () => {
    mocks.existingOrders = [{ _id: `order.${attemptId}`, clerkUserId: "user_1", status: "pending" }];
    await expect(createCheckoutSession(request())).resolves.toMatchObject({ success: false, code: "CHECKOUT_IN_PROGRESS" });
    expect(mocks.reserveInventoryAndCreateOrder).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("dos intentos simultáneos para la última unidad crean una sola sesión de pago", async () => {
    mocks.products[0].stock = 1;
    mocks.availability = [{ _id: "p1", stock: 0 }];
    mocks.existingOrders = [null, null, null];
    let reserveCall = 0;
    mocks.reserveInventoryAndCreateOrder.mockImplementation(() => {
      reserveCall += 1;
      return reserveCall === 2
        ? Promise.reject(Object.assign(new Error("STOCK_CHANGED"), { inventory: [{ productId: "p1", availableQuantity: 0 }] }))
        : Promise.resolve();
    });

    const results = await Promise.all([createCheckoutSession(request()), createCheckoutSession(request())]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(results.filter((result) => !result.success && result.code === "STOCK_CHANGED")).toHaveLength(1);
    expect(mocks.sessionCreate).toHaveBeenCalledTimes(1);
  });

  it("libera la reserva y devuelve un mensaje seguro cuando Stripe falla", async () => {
    const stripeError = Object.assign(new Error("Network failure with sk_test_should_be_hidden"), { code: "api_connection_error" });
    mocks.sessionCreate.mockRejectedValue(stripeError);
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: false, code: "PAYMENT_PROVIDER_ERROR" });
    expect(result).not.toHaveProperty("stack");
    expect(mocks.reserveInventoryAndCreateOrder).toHaveBeenCalledTimes(1);
    expect(mocks.releaseCheckoutReservation).toHaveBeenCalledTimes(1);
    expect(mocks.loggerError).toHaveBeenCalledWith("checkout_payment_session_failed", expect.objectContaining({
      stage: "creating_payment_session",
      provider: "stripe",
      errorCode: "api_connection_error",
      errorMessage: "Network failure with [REDACTED]",
    }));
    expect(mocks.loggerInfo).toHaveBeenCalledWith("inventory_reservation_released", expect.objectContaining({
      orderId: `order.${attemptId}`,
    }));
  });

  it("libera la reserva si falta la URL base antes de crear la sesión", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.VERCEL_URL;
    const result = await createCheckoutSession(request());
    expect(result).toMatchObject({ success: false, code: "PAYMENT_PROVIDER_ERROR" });
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
    expect(mocks.releaseCheckoutReservation).toHaveBeenCalledTimes(1);
    expect(mocks.loggerError).toHaveBeenCalledWith("checkout_payment_session_failed", expect.objectContaining({
      stage: "creating_payment_session",
      errorName: "Error",
      errorMessage: "NEXT_PUBLIC_BASE_URL no está configurada",
    }));
  });

  it("registra por separado el error original y un fallo al liberar inventario", async () => {
    mocks.sessionCreate.mockRejectedValue(Object.assign(new Error("Stripe unavailable"), { code: "api_error" }));
    mocks.releaseCheckoutReservation.mockRejectedValueOnce(Object.assign(new Error("Release rejected"), { statusCode: 503 }));

    const result = await createCheckoutSession(request());

    expect(result).toMatchObject({ success: false, code: "PAYMENT_PROVIDER_ERROR" });
    expect(mocks.loggerError).toHaveBeenCalledWith("checkout_payment_session_failed", expect.objectContaining({
      stage: "creating_payment_session",
      errorCode: "api_error",
    }));
    expect(mocks.loggerError).toHaveBeenCalledWith("inventory_reservation_release_failed", expect.objectContaining({
      stage: "releasing_inventory",
      errorCode: "HTTP_503",
    }));
  });

  it("no oculta una sesión válida si falla enlazarla al pedido", async () => {
    mocks.linkCheckoutSession.mockRejectedValueOnce(Object.assign(new Error("Order update rejected"), { statusCode: 503 }));

    const result = await createCheckoutSession(request());

    expect(result).toEqual({ success: true, checkoutUrl: "https://checkout.test", orderId: `order.${attemptId}` });
    expect(mocks.loggerError).toHaveBeenCalledWith("checkout_order_session_link_failed", expect.objectContaining({
      stage: "updating_order",
      paymentSessionId: "cs_1",
      errorCode: "HTTP_503",
    }));
    expect(mocks.loggerInfo).toHaveBeenCalledWith("checkout_completed", expect.objectContaining({ stage: "completed" }));
  });

  it("un error inesperado devuelve una respuesta genérica segura", async () => {
    mocks.getExistingCheckout.mockRejectedValueOnce(new Error("database connection secret"));
    const result = await createCheckoutSession(request());
    expect(result).toEqual({ success: false, code: "CHECKOUT_FAILED", message: "No pudimos iniciar el pago. Inténtalo nuevamente en unos momentos." });
  });
});
