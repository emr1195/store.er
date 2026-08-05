import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["create", "patch", "commit"]) {
    chain[name] = vi.fn(() => name === "commit" ? Promise.resolve({}) : chain);
  }
  return {
    constructEvent: vi.fn(),
    fetch: vi.fn(),
    create: vi.fn(),
    transaction: vi.fn(() => chain),
    chain,
  };
});

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ "stripe-signature": "sig" })) }));
vi.mock("@/lib/stripe", () => ({ default: {
  webhooks: { constructEvent: mocks.constructEvent },
  invoices: { retrieve: vi.fn() },
} }));
vi.mock("@/sanity/lib/backendClient", () => ({ backendClient: {
  fetch: mocks.fetch,
  create: mocks.create,
  transaction: mocks.transaction,
} }));
vi.mock("@/lib/orderService", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/orderService")>();
  return { ...original, getOrderForMutation: vi.fn(), cancelOrderWithInventory: vi.fn() };
});
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { POST } from "./route";

const request = () => new NextRequest("http://localhost/api/webhook", { method: "POST", body: "raw-body" });

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("rechaza una firma inválida", async () => {
    mocks.constructEvent.mockImplementation(() => { throw new Error("bad signature"); });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reconoce un evento ya procesado sin repetir operaciones", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_1", type: "customer.created", data: { object: {} } });
    mocks.fetch.mockResolvedValue("stripeEvent.evt_1");
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicate: true });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("registra una sola vez un evento válido", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_2", type: "customer.created", data: { object: {} } });
    mocks.fetch.mockResolvedValue(null);
    mocks.create.mockResolvedValue({});
    expect((await POST(request())).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ _id: "stripeEvent.evt_2", eventId: "evt_2" }));
  });
});
