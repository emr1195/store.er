import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getServerSession: vi.fn(), getOrder: vi.fn(), cancel: vi.fn() }));
vi.mock("@/lib/auth-session", () => ({
  getServerSession: mocks.getServerSession,
  hasAdminRole: (role: unknown) => role === "admin",
}));
vi.mock("@/lib/orderService", () => ({ getOrderForMutation: mocks.getOrder, cancelOrderWithInventory: mocks.cancel }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { POST } from "./route";

const request = () => new NextRequest("http://localhost/api/delete-order", {
  method: "POST",
  body: JSON.stringify({ orderId: "order.1" }),
  headers: { "content-type": "application/json" },
});

describe("cancel order permissions", () => {
  beforeEach(() => vi.clearAllMocks());
  it("devuelve 401 sin sesión", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
  });
  it("devuelve 404 si no existe", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    mocks.getOrder.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(404);
  });
  it("devuelve 403 para un pedido ajeno", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    mocks.getOrder.mockResolvedValue({ _id: "order.1", _rev: "r", clerkUserId: "u2", status: "pending" });
    expect((await POST(request())).status).toBe(403);
  });
  it("devuelve 409 si el pedido ya fue pagado", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    mocks.getOrder.mockResolvedValue({ _id: "order.1", _rev: "r", clerkUserId: "u1", status: "paid" });
    expect((await POST(request())).status).toBe(409);
  });
  it("permite cancelar al propietario", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    mocks.getOrder.mockResolvedValue({ _id: "order.1", _rev: "r", clerkUserId: "u1", status: "pending" });
    mocks.cancel.mockResolvedValue(undefined);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.cancel).toHaveBeenCalledOnce();
  });
  it("permite cancelar a un administrador validado", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "admin", role: "admin" } });
    mocks.getOrder.mockResolvedValue({ _id: "order.1", _rev: "r", clerkUserId: "u2", status: "payment_pending" });
    mocks.cancel.mockResolvedValue(undefined);
    expect((await POST(request())).status).toBe(200);
  });
});
