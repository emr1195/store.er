import { describe, expect, it } from "vitest";
import type { CartItem } from "./store";
import { reconcileCartItemStock } from "./store";

const item = (quantity: number): CartItem => ({
  quantity,
  product: {
    _id: "p1",
    _type: "product",
    _createdAt: "2026-01-01T00:00:00.000Z",
    _updatedAt: "2026-01-01T00:00:00.000Z",
    _rev: "r1",
    name: "Producto",
    stock: 5,
  },
});

describe("reconcileCartItemStock", () => {
  it("reduce la cantidad al stock real sin hacerlo silenciosamente en la acción cliente", () => {
    const [result] = reconcileCartItemStock([item(4)], "p1", 1);
    expect(result.quantity).toBe(1);
    expect(result.product.stock).toBe(1);
  });

  it("marca el producto agotado y conserva la línea para que el usuario pueda eliminarla", () => {
    const [result] = reconcileCartItemStock([item(2)], "p1", 0);
    expect(result.quantity).toBe(2);
    expect(result.product.stock).toBe(0);
  });
});
