import { getSql, withTransaction } from "@/lib/db";
import { canCustomerCancel, isOrderStatus, type OrderStatus } from "./orders";
import type { PoolClient } from "@neondatabase/serverless";

export type StoredOrder = {
  _id: string;
  _rev: string;
  clerkUserId?: string;
  status?: string;
  inventoryReserved?: boolean;
  totalCents?: number;
  currency?: string;
  stripePaymentIntentId?: string;
  refundedCents?: number;
  products?: Array<{ productId?: string; quantity?: number }>;
};

export async function getOrderForMutation(orderId: string): Promise<StoredOrder | null> {
  const rows = await getSql().query(`
    select id as "_id", updated_at::text as "_rev", clerk_user_id as "clerkUserId",
      status, inventory_reserved as "inventoryReserved", total_cents as "totalCents",
      currency, stripe_payment_intent_id as "stripePaymentIntentId", refunded_cents as "refundedCents"
    from orders where id = $1 limit 1
  `, [orderId]);
  if (!rows[0]) return null;
  const items = await getSql().query(`
    select product_id as "productId", quantity from order_items where order_id = $1
  `, [orderId]);
  return { ...(rows[0] as StoredOrder), products: items as StoredOrder["products"] };
}

export async function getOrderByPaymentIntent(paymentIntentId: string): Promise<StoredOrder | null> {
  const rows = await getSql().query("select id from orders where stripe_payment_intent_id = $1 limit 1", [paymentIntentId]);
  return rows[0]?.id ? getOrderForMutation(String(rows[0].id)) : null;
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

  await withTransaction(async (client) => {
    const locked = await client.query<{ status: string; inventory_reserved: boolean }>(
      "select status, inventory_reserved from orders where id = $1 for update", [order._id],
    );
    const current = locked.rows[0];
    if (!current) throw new Error("ORDER_NOT_FOUND");
    if (!isOrderStatus(current.status) || !canCustomerCancel(current.status)) throw new Error("ORDER_NOT_CANCELLABLE");
    if (webhookEvent) await insertWebhookEvent(client, webhookEvent.id, webhookEvent.type, order._id);
    if (current.inventory_reserved) await restoreInventory(client, order._id, reason, "cancel");
    await client.query(`update orders set status = $1, inventory_reserved = false,
      cancelled_at = now(), updated_at = now() where id = $2`, [targetStatus satisfies OrderStatus, order._id]);
    await insertAudit(client, order._id, actorId, reason, current.status, targetStatus);
  });
}

export async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const rows = await getSql().query("select 1 from webhook_events where event_id = $1 limit 1", [eventId]);
  return rows.length > 0;
}

export async function recordWebhookEvent(event: { id: string; type: string }, orderId?: string): Promise<void> {
  await getSql().query(`insert into webhook_events (id, provider, event_id, event_type, order_id, processed_at)
    values ($1,'stripe',$2,$3,$4,now())`,
    [webhookEventDocumentId(event.id), event.id, event.type, orderId ?? null]);
}

export async function confirmOrderPayment(input: {
  event: { id: string; type: string };
  order: StoredOrder;
  sessionId: string;
  paymentIntentId: string;
  customerId: string;
  invoice: Record<string, unknown> | null;
}): Promise<void> {
  await withTransaction(async (client) => {
    const locked = await client.query<{ status: string }>("select status from orders where id = $1 for update", [input.order._id]);
    const current = locked.rows[0];
    if (!current) throw new Error("ORDER_NOT_FOUND");
    await insertWebhookEvent(client, input.event.id, input.event.type, input.order._id);
    await client.query(`update orders set status = 'paid', stripe_checkout_session_id = $1,
      stripe_payment_intent_id = $2, stripe_customer_id = $3, invoice = $4::jsonb, updated_at = now()
      where id = $5`, [input.sessionId, input.paymentIntentId, input.customerId,
      JSON.stringify(input.invoice), input.order._id]);
    await insertAudit(client, input.order._id, "stripe", "payment_confirmed", current.status, "paid");
  });
}

export async function failOrderAmountMismatch(event: { id: string; type: string }, order: StoredOrder): Promise<void> {
  await withTransaction(async (client) => {
    await insertWebhookEvent(client, event.id, event.type, order._id);
    await client.query("update orders set status = 'payment_failed', updated_at = now() where id = $1", [order._id]);
    await insertAudit(client, order._id, "stripe", "payment_amount_mismatch", order.status, "payment_failed");
  });
}

export async function recordRefund(input: {
  event: { id: string; type: string };
  order: StoredOrder;
  refundedCents: number;
  fullRefund: boolean;
}): Promise<void> {
  await withTransaction(async (client) => {
    const locked = await client.query<{ status: string; inventory_reserved: boolean }>(
      "select status, inventory_reserved from orders where id = $1 for update", [input.order._id]);
    const current = locked.rows[0];
    if (!current) throw new Error("ORDER_NOT_FOUND");
    await insertWebhookEvent(client, input.event.id, input.event.type, input.order._id);
    if (input.fullRefund && current.inventory_reserved) await restoreInventory(client, input.order._id, "payment_refunded", "refund");
    await client.query(`update orders set refunded_cents = $1,
      status = case when $2 then 'refunded' else status end,
      inventory_reserved = case when $2 then false else inventory_reserved end,
      updated_at = now() where id = $3`, [input.refundedCents, input.fullRefund, input.order._id]);
    await insertAudit(client, input.order._id, "stripe",
      input.fullRefund ? "payment_refunded" : "payment_partially_refunded",
      current.status, input.fullRefund ? "refunded" : current.status);
  });
}

async function insertWebhookEvent(client: PoolClient, eventId: string, eventType: string, orderId?: string) {
  await client.query(`insert into webhook_events (id, provider, event_id, event_type, order_id, processed_at)
    values ($1,'stripe',$2,$3,$4,now())`,
    [webhookEventDocumentId(eventId), eventId, eventType, orderId ?? null]);
}

async function insertAudit(client: PoolClient, orderId: string, actorId: string, action: string,
  previousStatus: string | undefined, newStatus: string | undefined) {
  await client.query(`insert into order_audits
    (id, order_id, actor_id, action, previous_status, new_status, created_at)
    values ($1,$2,$3,$4,$5,$6,now())`,
    [`audit.${crypto.randomUUID()}`, orderId, actorId, action, previousStatus ?? null, newStatus ?? null]);
}

async function restoreInventory(client: PoolClient, orderId: string, reason: string, suffix: string) {
  const items = await client.query<{ product_id: string; quantity: number }>(
    "select product_id, quantity from order_items where order_id = $1 and product_id is not null", [orderId]);
  for (const item of items.rows) {
    const movementId = `inventory.${safeId(orderId)}.${safeId(item.product_id)}.${suffix}`;
    const inserted = await client.query(`insert into inventory_movements
      (id, product_id, order_id, quantity, reason, created_at)
      values ($1,$2,$3,$4,$5,now()) on conflict (id) do nothing returning id`,
      [movementId, item.product_id, orderId, item.quantity, reason]);
    if (inserted.rowCount) {
      await client.query("update products set stock = stock + $1, updated_at = now() where id = $2", [item.quantity, item.product_id]);
    }
  }
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function webhookEventDocumentId(eventId: string): string {
  return `stripeEvent.${safeId(eventId)}`;
}
