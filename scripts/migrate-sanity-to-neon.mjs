import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";
import { neon } from "@neondatabase/serverless";

const required = [
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "NEXT_PUBLIC_SANITY_API_VERSION",
  "DATABASE_URL",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) throw new Error(`Missing environment variables: ${missing.join(", ")}`);

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});
const sql = neon(process.env.DATABASE_URL);

const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
for (const statement of schema.split(";").map((value) => value.trim()).filter(Boolean)) {
  await sql.query(statement);
}

const [categories, products, orders, audits, movements, webhookEvents] = await Promise.all([
  sanity.fetch('*[_type == "category"]'),
  sanity.fetch('*[_type == "product"]'),
  sanity.fetch('*[_type == "order"]'),
  sanity.fetch('*[_type == "orderAudit"]'),
  sanity.fetch('*[_type == "inventoryMovement"]'),
  sanity.fetch('*[_type == "webhookEvent"]'),
]);

const queries = [];
for (const category of categories) {
  queries.push(sql.query(`
    insert into categories (id, revision, created_at, updated_at, title, slug, description, image)
    values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    on conflict (id) do update set revision = excluded.revision, updated_at = excluded.updated_at,
      title = excluded.title, slug = excluded.slug, description = excluded.description, image = excluded.image
  `, [category._id, category._rev ?? null, category._createdAt, category._updatedAt, category.title ?? null,
    category.slug?.current ?? null, category.description ?? null, JSON.stringify(category.image ?? null)]));
}

for (const product of products) {
  queries.push(sql.query(`
    insert into products (id, revision, created_at, updated_at, name, slug, images, intro, description,
      price, discount, stock, sku, is_active, taxable, status, variant)
    values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    on conflict (id) do update set revision = excluded.revision, updated_at = excluded.updated_at,
      name = excluded.name, slug = excluded.slug, images = excluded.images, intro = excluded.intro,
      description = excluded.description, price = excluded.price, discount = excluded.discount,
      stock = excluded.stock, sku = excluded.sku, is_active = excluded.is_active,
      taxable = excluded.taxable, status = excluded.status, variant = excluded.variant
  `, [product._id, product._rev ?? null, product._createdAt, product._updatedAt, product.name,
    product.slug?.current ?? product._id, JSON.stringify(product.images ?? []), product.intro ?? null,
    product.description ?? null, product.price ?? 0, product.discount ?? 0, product.stock ?? 0,
    product.sku ?? null, product.isActive !== false, product.taxable !== false, product.status ?? null,
    product.variant ?? null]));
}

for (const product of products) {
  for (const reference of product.categories ?? []) {
    if (!categories.some((category) => category._id === reference._ref)) continue;
    queries.push(sql.query(`
      insert into product_categories (product_id, category_id) values ($1, $2)
      on conflict (product_id, category_id) do nothing
    `, [product._id, reference._ref]));
  }
}

for (const order of orders) {
  queries.push(sql.query(`
    insert into orders (id, revision, created_at, updated_at, order_number, invoice,
      stripe_checkout_session_id, stripe_customer_id, clerk_user_id, customer_name, email,
      stripe_payment_intent_id, total_price, subtotal_cents, discount_cents, tax_base_cents,
      itbms_cents, shipping_cents, total_cents, refunded_cents, inventory_reserved,
      checkout_attempt_id, cancelled_at, currency, amount_discount, status, order_date)
    values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
    on conflict (id) do update set revision = excluded.revision, updated_at = excluded.updated_at,
      invoice = excluded.invoice, stripe_checkout_session_id = excluded.stripe_checkout_session_id,
      stripe_customer_id = excluded.stripe_customer_id, stripe_payment_intent_id = excluded.stripe_payment_intent_id,
      total_price = excluded.total_price, subtotal_cents = excluded.subtotal_cents,
      discount_cents = excluded.discount_cents, tax_base_cents = excluded.tax_base_cents,
      itbms_cents = excluded.itbms_cents, shipping_cents = excluded.shipping_cents,
      total_cents = excluded.total_cents, refunded_cents = excluded.refunded_cents,
      inventory_reserved = excluded.inventory_reserved, cancelled_at = excluded.cancelled_at,
      status = excluded.status
  `, [order._id, order._rev ?? null, order._createdAt, order._updatedAt, order.orderNumber ?? order._id,
    JSON.stringify(order.invoice ?? null), order.stripeCheckoutSessionId ?? null,
    order.stripeCustomerId ?? null, order.clerkUserId, order.customerName ?? "Cliente", order.email ?? "unknown@example.invalid",
    order.stripePaymentIntentId ?? null, order.totalPrice ?? 0, order.subtotalCents ?? 0,
    order.discountCents ?? 0, order.taxBaseCents ?? 0, order.itbmsCents ?? 0,
    order.shippingCents ?? 0, order.totalCents ?? Math.round((order.totalPrice ?? 0) * 100),
    order.refundedCents ?? 0, order.inventoryReserved === true, order.checkoutAttemptId ?? null,
    order.cancelledAt ?? null, (order.currency ?? "usd").toLowerCase(), order.amountDiscount ?? 0,
    order.status ?? "pending", order.orderDate ?? order._createdAt]));

  for (const [index, item] of (order.products ?? []).entries()) {
    queries.push(sql.query(`
      insert into order_items (id, order_id, product_id, quantity, name_snapshot, sku_snapshot,
        variant_snapshot, unit_price_cents, subtotal_cents, discount_cents, itbms_cents, total_cents)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      on conflict (id) do update set product_id = excluded.product_id, quantity = excluded.quantity,
        name_snapshot = excluded.name_snapshot, sku_snapshot = excluded.sku_snapshot,
        variant_snapshot = excluded.variant_snapshot, unit_price_cents = excluded.unit_price_cents,
        subtotal_cents = excluded.subtotal_cents, discount_cents = excluded.discount_cents,
        itbms_cents = excluded.itbms_cents, total_cents = excluded.total_cents
    `, [item._key ?? `${order._id}.${index}`, order._id, item.productId ?? item.product?._ref ?? null,
      item.quantity ?? 1, item.nameSnapshot ?? "Producto", item.skuSnapshot ?? null,
      item.variantSnapshot ?? null, item.unitPriceCents ?? 0, item.subtotalCents ?? 0,
      item.discountCents ?? 0, item.itbmsCents ?? 0, item.totalCents ?? 0]));
  }
}

for (const audit of audits) {
  queries.push(sql.query(`
    insert into order_audits (id, order_id, actor_id, action, previous_status, new_status, created_at)
    values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing
  `, [audit._id, audit.orderId, audit.actorId, audit.action, audit.previousStatus ?? null,
    audit.newStatus ?? null, audit.createdAt ?? audit._createdAt]));
}
for (const movement of movements) {
  queries.push(sql.query(`
    insert into inventory_movements (id, product_id, order_id, quantity, reason, created_at)
    values ($1,$2,$3,$4,$5,$6) on conflict (id) do nothing
  `, [movement._id, movement.productId, movement.orderId, movement.quantity, movement.reason,
    movement.createdAt ?? movement._createdAt]));
}
for (const event of webhookEvents) {
  queries.push(sql.query(`
    insert into webhook_events (id, provider, event_id, event_type, order_id, processed_at)
    values ($1,$2,$3,$4,$5,$6) on conflict (id) do nothing
  `, [event._id, event.provider, event.eventId, event.eventType, event.orderId ?? null,
    event.processedAt ?? event._createdAt]));
}

if (queries.length > 0) await sql.transaction(queries);
await sql`
  insert into data_migrations (id, source, details)
  values ('sanity-to-neon-v1', 'sanity', ${JSON.stringify({
    categories: categories.length,
    products: products.length,
    orders: orders.length,
    orderItems: orders.reduce((sum, order) => sum + (order.products?.length ?? 0), 0),
    audits: audits.length,
    movements: movements.length,
    webhookEvents: webhookEvents.length,
  })}::jsonb)
  on conflict (id) do update set details = excluded.details, completed_at = now()
`;

console.log(JSON.stringify({
  categories: categories.length,
  products: products.length,
  orders: orders.length,
  orderItems: orders.reduce((sum, order) => sum + (order.products?.length ?? 0), 0),
  audits: audits.length,
  movements: movements.length,
  webhookEvents: webhookEvents.length,
}, null, 2));
