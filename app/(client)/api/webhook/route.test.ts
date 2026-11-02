import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["create", "patch", "commit"]) {
    chain[name] = vi.fn(() => name === "commit" ? Promise.resolve({}) : chain);
  }
  return {
    constructEvent: vi.fn(),
    isWebhookProcessed: vi.fn(),
    recordWebhookEvent: vi.fn(),
    confirmOrderPayment: vi.fn(),
    failOrderAmountMismatch: vi.fn(),
    getOrderByPaymentIntent: vi.fn(),
    recordRefund: vi.fn(),
    chain,
    getOrderForMutation: vi.fn(),
    cancelOrderWithInventory: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ "stripe-signature": "sig" })) }));
vi.mock("@/lib/stripe", () => ({ default: {
  webhooks: { constructEvent: mocks.constructEvent },
  invoices: { retrieve: vi.fn() },
} }));
vi.mock("@/lib/orderService", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/orderService")>();
  return {
    ...original,
    getOrderForMutation: mocks.getOrderForMutation,
    cancelOrderWithInventory: mocks.cancelOrderWithInventory,
    isWebhookProcessed: mocks.isWebhookProcessed,
    recordWebhookEvent: mocks.recordWebhookEvent,
    confirmOrderPayment: mocks.confirmOrderPayment,
    failOrderAmountMismatch: mocks.failOrderAmountMismatch,
    getOrderByPaymentIntent: mocks.getOrderByPaymentIntent,
    recordRefund: mocks.recordRefund,
  };
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
    expect(mocks.recordWebhookEvent).not.toHaveBeenCalled();
  });

  it("reconoce un evento ya procesado sin repetir operaciones", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_1", type: "customer.created", data: { object: {} } });
    mocks.isWebhookProcessed.mockResolvedValue(true);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicate: true });
    expect(mocks.recordWebhookEvent).not.toHaveBeenCalled();
  });

  it("registra una sola vez un evento válido", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_2", type: "customer.created", data: { object: {} } });
    mocks.isWebhookProcessed.mockResolvedValue(false);
    mocks.recordWebhookEvent.mockResolvedValue(undefined);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.recordWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({ id: "evt_2" }));
  });

  it("un checkout vencido libera la reserva mediante la operación idempotente", async () => {
    mocks.constructEvent.mockReturnValue({
      id: "evt_expired",
      type: "checkout.session.expired",
      data: { object: { id: "cs_expired", metadata: { orderId: "order.1" } } },
    });
    mocks.isWebhookProcessed.mockResolvedValue(false);
    mocks.getOrderForMutation.mockResolvedValue({
      _id: "order.1",
      _rev: "r1",
      status: "payment_pending",
      inventoryReserved: true,
      products: [{ productId: "p1", quantity: 1 }],
    });

    expect((await POST(request())).status).toBe(200);
    expect(mocks.cancelOrderWithInventory).toHaveBeenCalledWith(expect.objectContaining({
      reason: "checkout_expired",
      targetStatus: "cancelled",
    }));
  });
});
