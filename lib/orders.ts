export const ORDER_STATUSES = [
  "pending",
  "payment_pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
  "refunded",
  "archived",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["payment_pending", "cancelled", "payment_failed"],
  payment_pending: ["paid", "cancelled", "payment_failed"],
  paid: ["processing", "refunded"],
  processing: ["shipped", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded", "archived"],
  cancelled: ["archived"],
  payment_failed: ["cancelled", "archived"],
  refunded: ["archived"],
  archived: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function canCustomerCancel(status: OrderStatus): boolean {
  return status === "pending" || status === "payment_pending";
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}
