export type InventoryAvailability = {
  productId: string;
  availableQuantity: number;
};

export class StockChangedError extends Error {
  readonly code = "STOCK_CHANGED" as const;

  constructor(
    readonly inventory: InventoryAvailability[],
    message = "La disponibilidad de uno de los productos cambió."
  ) {
    super(message);
    this.name = "StockChangedError";
  }
}

export type CheckoutFailureCode =
  | "STOCK_CHANGED"
  | "EMPTY_CART"
  | "INVALID_CART"
  | "UNAUTHORIZED"
  | "CHECKOUT_IN_PROGRESS"
  | "CHECKOUT_FAILED";

export type CheckoutResult =
  | { success: true; checkoutUrl: string; orderId: string }
  | {
      success: false;
      code: CheckoutFailureCode;
      message: string;
      inventory?: InventoryAvailability[];
    };
