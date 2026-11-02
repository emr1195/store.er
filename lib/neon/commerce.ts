import { getSql, withTransaction } from "@/lib/db";
import type { InventoryAvailability } from "@/lib/checkout";

export type CatalogProduct = {
  _id: string;
  _rev: string;
  name?: string;
  description?: string;
  sku?: string;
  variant?: string;
  price?: number;
  discount?: number;
  stock?: number;
  taxable?: boolean;
  isActive?: boolean;
};

export type ExistingCheckoutOrder = {
  _id: string;
  clerkUserId?: string;
  status?: string;
  stripeCheckoutSessionId?: string;
};

export type SuccessOrder = {
  _id: string;
  orderNumber?: string;
  status?: string;
  totalCents?: number;
  currency?: string;
  products?: Array<{ productId?: string; quantity?: number }>;
};

export type CheckoutOrderInput = {
  id: string;
  orderNumber: string;
  checkoutAttemptId: string;
  clerkUserId: string;
  customerName: string;
  email: string;
  subtotalCents: number;
  discountCents: number;
  taxBaseCents: number;
  itbmsCents: number;
  shippingCents: number;
  totalCents: number;
  totalPrice: number;
  amountDiscount: number;
  currency: string;
  orderDate: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    nameSnapshot: string;
    skuSnapshot?: string;
    variantSnapshot?: string;
    unitPriceCents: number;
    subtotalCents: number;
    discountCents: number;
    itbmsCents: number;
    totalCents: number;
  }>;
};

export async function getExistingCheckout(orderId: string): Promise<ExistingCheckoutOrder | null> {
  const rows = await getSql().query(`
    select id as "_id", clerk_user_id as "clerkUserId", status,
      stripe_checkout_session_id as "stripeCheckoutSessionId"
    from orders where id = $1 limit 1
  `, [orderId]);
  return (rows[0] as ExistingCheckoutOrder | undefined) ?? null;
}

export async function getSuccessOrder(input: {
  orderId?: string;
  sessionId: string;
  userId: string;
}): Promise<SuccessOrder | null> {
  const rows = input.orderId
    ? await getSql().query(`select id as "_id", order_number as "orderNumber", status,
        total_cents as "totalCents", currency from orders
        where id = $1 and clerk_user_id = $2 limit 1`, [input.orderId, input.userId])
    : await getSql().query(`select id as "_id", order_number as "orderNumber", status,
        total_cents as "totalCents", currency from orders
        where stripe_checkout_session_id = $1 and clerk_user_id = $2 limit 1`, [input.sessionId, input.userId]);
  if (!rows[0]) return null;
  const items = await getSql().query(`select product_id as "productId", quantity
    from order_items where order_id = $1`, [String(rows[0]._id)]);
  return { ...(rows[0] as SuccessOrder), products: items as SuccessOrder["products"] };
}

export async function fetchProductsForCheckout(productIds: string[]): Promise<CatalogProduct[]> {
  const rows = await getSql().query(`
    select id as "_id", revision as "_rev", name, description, sku, variant,
      price::float8 as price, discount::float8 as discount, stock, taxable,
      is_active as "isActive" from products where id = any($1::text[])
  `, [productIds]);
  return rows as CatalogProduct[];
}

export async function loadInventoryAvailability(productIds: string[]): Promise<InventoryAvailability[]> {
  const rows = await getSql().query(`select id, stock from products where id = any($1::text[])`, [productIds]);
  const byId = new Map(rows.map((row) => [String(row.id), Number(row.stock)]));
  return productIds.map((productId) => ({
    productId,
    availableQuantity: Number.isSafeInteger(byId.get(productId)) ? Math.max(0, byId.get(productId) ?? 0) : 0,
  }));
}

export async function reserveInventoryAndCreateOrder(order: CheckoutOrderInput): Promise<void> {
  await withTransaction(async (client) => {
    const productIds = order.items.map((item) => item.productId);
    const locked = await client.query<{ id: string; stock: number; is_active: boolean }>(
      "select id, stock, is_active from products where id = any($1::text[]) for update",
      [productIds],
    );
    const byId = new Map(locked.rows.map((row) => [row.id, row]));
    const inventory = order.items.map((item) => ({
      productId: item.productId,
      availableQuantity: Math.max(0, byId.get(item.productId)?.stock ?? 0),
    }));
    if (locked.rows.length !== productIds.length || order.items.some((item) => {
      const product = byId.get(item.productId);
      return !product?.is_active || product.stock < item.quantity;
    })) {
      const error = new Error("STOCK_CHANGED") as Error & { inventory: InventoryAvailability[] };
      error.inventory = inventory;
      throw error;
    }

    await client.query(`
      insert into orders (id, order_number, checkout_attempt_id, clerk_user_id, customer_name, email,
        stripe_customer_id, stripe_payment_intent_id, total_price, subtotal_cents, discount_cents,
        tax_base_cents, itbms_cents, shipping_cents, total_cents, amount_discount, currency,
        status, inventory_reserved, order_date)
      values ($1,$2,$3,$4,$5,$6,'pending','pending',$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending',true,$16)
    `, [order.id, order.orderNumber, order.checkoutAttemptId, order.clerkUserId, order.customerName,
      order.email, order.totalPrice, order.subtotalCents, order.discountCents, order.taxBaseCents,
      order.itbmsCents, order.shippingCents, order.totalCents, order.amountDiscount,
      order.currency.toLowerCase(), order.orderDate]);

    for (const item of order.items) {
      await client.query("update products set stock = stock - $1, updated_at = now() where id = $2", [item.quantity, item.productId]);
      await client.query(`
        insert into order_items (id, order_id, product_id, quantity, name_snapshot, sku_snapshot,
          variant_snapshot, unit_price_cents, subtotal_cents, discount_cents, itbms_cents, total_cents)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `, [item.id, order.id, item.productId, item.quantity, item.nameSnapshot, item.skuSnapshot ?? null,
        item.variantSnapshot ?? null, item.unitPriceCents, item.subtotalCents, item.discountCents,
        item.itbmsCents, item.totalCents]);
      await client.query(`
        insert into inventory_movements (id, product_id, order_id, quantity, reason, created_at)
        values ($1,$2,$3,$4,'checkout_reserved',$5)
      `, [`inventory.${order.checkoutAttemptId}.${safeId(item.productId)}.reserve`, item.productId,
        order.id, -item.quantity, order.orderDate]);
    }
  });
}

export async function linkCheckoutSession(input: {
  orderId: string;
  sessionId: string;
  customerId: string;
}): Promise<void> {
  await getSql().query(`
    update orders set stripe_checkout_session_id = $1, stripe_customer_id = $2,
      status = 'payment_pending', updated_at = now() where id = $3
  `, [input.sessionId, input.customerId, input.orderId]);
}

export async function releaseCheckoutReservation(orderId: string, attemptId: string): Promise<void> {
  await withTransaction(async (client) => {
    const orderResult = await client.query<{ inventory_reserved: boolean }>(
      "select inventory_reserved from orders where id = $1 for update",
      [orderId],
    );
    if (!orderResult.rows[0]?.inventory_reserved) return;
    const items = await client.query<{ product_id: string; quantity: number }>(
      "select product_id, quantity from order_items where order_id = $1 and product_id is not null",
      [orderId],
    );
    for (const item of items.rows) {
      const movement = await client.query(`
        insert into inventory_movements (id, product_id, order_id, quantity, reason, created_at)
        values ($1,$2,$3,$4,'checkout_failed_release',now()) on conflict (id) do nothing returning id
      `, [`inventory.${attemptId}.${safeId(item.product_id)}.release`, item.product_id, orderId, item.quantity]);
      if (movement.rowCount) {
        await client.query("update products set stock = stock + $1, updated_at = now() where id = $2", [item.quantity, item.product_id]);
      }
    }
    await client.query("update orders set status = 'payment_failed', inventory_reserved = false, updated_at = now() where id = $1", [orderId]);
  });
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
