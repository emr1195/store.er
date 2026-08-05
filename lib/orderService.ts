import { backendClient } from "@/sanity/lib/backendClient";
import { canCustomerCancel, isOrderStatus, type OrderStatus } from "./orders";

export type StoredOrder = {
  _id: string;
  _rev: string;
  clerkUserId?: string;
  status?: string;
  inventoryReserved?: boolean;
  products?: Array<{ productId?: string; quantity?: number }>;
};

export async function getOrderForMutation(orderId: string): Promise<StoredOrder | null> {
  return backendClient.fetch(
    `*[_type == "order" && _id == $orderId][0]{_id,_rev,clerkUserId,status,inventoryReserved,products[]{productId,quantity}}`,
    { orderId }
  );
}

export async function cancelOrderWithInventory(input: {
  order: StoredOrder;
  actorId: string;
  reason: string;
  targetStatus?: "cancelled" | "payment_failed";
  webhookEvent?: { id: string; type: string };
}): Promise<void> {
  const { order, actorId, reason, webhookEvent, targetStatus = "cancelled" } = input;
  if (!isOrderStatus(order.status)) throw new Error("INVALID_ORDER_STATUS");
  if (!canCustomerCancel(order.status)) throw new Error("ORDER_NOT_CANCELLABLE");

  const now = new Date().toISOString();
  let transaction = backendClient.transaction();
  if (webhookEvent) {
    transaction = transaction.create({
      _id: webhookEventDocumentId(webhookEvent.id),
      _type: "webhookEvent",
      provider: "stripe",
      eventId: webhookEvent.id,
      eventType: webhookEvent.type,
      orderId: order._id,
      processedAt: now,
    });
  }

  transaction = transaction
    .patch(order._id, (patch) => patch.ifRevisionId(order._rev).set({
      status: targetStatus satisfies OrderStatus,
      inventoryReserved: false,
      cancelledAt: now,
    }))
    .create({
      _id: `audit.${crypto.randomUUID()}`,
      _type: "orderAudit",
      orderId: order._id,
      actorId,
      action: reason,
      previousStatus: order.status,
      newStatus: targetStatus,
      createdAt: now,
    });

  if (order.inventoryReserved) {
    for (const item of order.products ?? []) {
      if (!item.productId || !Number.isSafeInteger(item.quantity) || (item.quantity ?? 0) <= 0) continue;
      const movementId = `inventory.${order._id.replace(/[^a-zA-Z0-9_-]/g, "_")}.${item.productId.replace(/[^a-zA-Z0-9_-]/g, "_")}.cancel`;
      transaction = transaction
        .patch(item.productId, (patch) => patch.inc({ stock: item.quantity! }))
        .createIfNotExists({
          _id: movementId,
          _type: "inventoryMovement",
          productId: item.productId,
          orderId: order._id,
          quantity: item.quantity,
          reason,
          createdAt: now,
        });
    }
  }
  await transaction.commit();
}

export function webhookEventDocumentId(eventId: string): string {
  return `stripeEvent.${eventId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
