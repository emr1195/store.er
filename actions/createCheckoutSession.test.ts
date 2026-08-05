import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["create", "createIfNotExists", "patch", "set", "commit"]) {
    chain[name] = vi.fn(() => name === "commit" ? Promise.resolve({}) : chain);
  }
  return {
    auth: vi.fn(),
    currentUser: vi.fn(),
    fetch: vi.fn(),
    transaction: vi.fn(() => chain),
    patch: vi.fn(() => chain),
    chain,
    customerList: vi.fn(),
    sessionCreate: vi.fn(),
  };
});

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth, currentUser: mocks.currentUser }));
vi.mock("@/sanity/lib/backendClient", () => ({
  backendClient: { fetch: mocks.fetch, transaction: mocks.transaction, patch: mocks.patch },
}));
vi.mock("@/lib/stripe", () => ({ default: {
  customers: { list: mocks.customerList },
  checkout: { sessions: { create: mocks.sessionCreate } },
} }));

import { createCheckoutSession } from "./createCheckoutSession";

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_ITBMS_RATE = "0.07";
    process.env.NEXT_PUBLIC_STANDARD_SHIPPING_CENTS = "0";
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.currentUser.mockResolvedValue({
      fullName: "Cliente",
      firstName: "Cliente",
      primaryEmailAddress: { emailAddress: "client@example.com" },
    });
    mocks.fetch.mockResolvedValue([{ _id: "p1", _rev: "r1", name: "Producto", price: 10, stock: 5, isActive: true }]);
    mocks.customerList.mockResolvedValue({ data: [] });
    mocks.sessionCreate.mockResolvedValue({ id: "cs_1", url: "https://checkout.test", customer: null });
  });

  it("rechaza usuarios no autenticados", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(createCheckoutSession({ items: [{ productId: "p1", quantity: 1 }] })).rejects.toThrow("iniciar sesión");
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("usa el precio consultado y descarta el precio manipulado del cliente", async () => {
    const url = await createCheckoutSession({ items: [{ productId: "p1", quantity: 1, price: 0.01 }] } as never);
    expect(url).toBe("https://checkout.test");
    const payload = mocks.sessionCreate.mock.calls[0][0];
    expect(payload.line_items[0].price_data.unit_amount).toBe(1000);
    expect(payload.line_items[1].price_data.unit_amount).toBe(70);
  });

  it("rechaza stock insuficiente", async () => {
    await expect(createCheckoutSession({ items: [{ productId: "p1", quantity: 6 }] })).rejects.toThrow("Stock insuficiente");
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it("rechaza cantidades inválidas", async () => {
    await expect(createCheckoutSession({ items: [{ productId: "p1", quantity: -1 }] })).rejects.toThrow("datos inválidos");
  });
});
