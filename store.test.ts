import { describe, expect, it } from "vitest";
import type { CartItem } from "./store";
import { completeCheckoutInCart, reconcileCartItemStock, removePurchasedCartItems } from "./store";

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

describe("removePurchasedCartItems", () => {
  it("elimina únicamente la cantidad incluida en el pedido pagado", () => {
    const result = removePurchasedCartItems([item(3)], [{ productId: "p1", quantity: 2 }]);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it("elimina la línea completa cuando se pagó toda su cantidad", () => {
    expect(removePurchasedCartItems([item(2)], [{ productId: "p1", quantity: 2 }])).toEqual([]);
  });

  it("conserva productos que no pertenecen al pedido", () => {
    const other = { ...item(1), product: { ...item(1).product, _id: "p2" } };
    const result = removePurchasedCartItems([item(2), other], [{ productId: "p1", quantity: 2 }]);

    expect(result).toEqual([other]);
  });

  it("no descuenta dos veces el mismo pedido al recargar la página de éxito", () => {
    const first = completeCheckoutInCart(
      { items: [item(3)], completedCheckoutIds: [] },
      "order.test",
      [{ productId: "p1", quantity: 2 }]
    );
    const second = completeCheckoutInCart(first, "order.test", [{ productId: "p1", quantity: 2 }]);

    expect(second.items[0].quantity).toBe(1);
    expect(second.completedCheckoutIds).toEqual(["order.test"]);
  });
});
