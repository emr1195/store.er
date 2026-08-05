import { describe, expect, it } from "vitest";
import { canCustomerCancel, canTransitionOrder, isOrderStatus } from "./orders";

describe("order state machine", () => {
  it("permite transiciones válidas", () => {
    expect(canTransitionOrder("payment_pending", "paid")).toBe(true);
    expect(canTransitionOrder("paid", "processing")).toBe(true);
  });
  it("rechaza transiciones inválidas", () => {
    expect(canTransitionOrder("delivered", "pending")).toBe(false);
    expect(canTransitionOrder("cancelled", "paid")).toBe(false);
  });
  it("limita cancelaciones del cliente a pedidos no pagados", () => {
    expect(canCustomerCancel("pending")).toBe(true);
    expect(canCustomerCancel("payment_pending")).toBe(true);
    expect(canCustomerCancel("paid")).toBe(false);
  });
  it("valida estados externos", () => {
    expect(isOrderStatus("refunded")).toBe(true);
    expect(isOrderStatus("hacked")).toBe(false);
  });
});
