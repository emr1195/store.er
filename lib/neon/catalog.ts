import type { Category, MY_ORDERS_QUERYResult, Product } from "@/sanity.types";
import { getSql } from "@/lib/db";

const productProjection = `
  p.id as "_id",
  'product'::text as "_type",
  p.created_at::text as "_createdAt",
  p.updated_at::text as "_updatedAt",
  p.revision as "_rev",
  p.name,
  jsonb_build_object('current', p.slug, '_type', 'slug') as slug,
  p.images,
  p.intro,
  p.description,
  p.price::float8 as price,
  p.discount::float8 as discount,
  p.stock,
  p.sku,
  p.is_active as "isActive",
  p.taxable,
  p.status,
  p.variant,
  coalesce((
    select jsonb_agg(jsonb_build_object('_key', pc.category_id, '_ref', pc.category_id, '_type', 'reference'))
    from product_categories pc where pc.product_id = p.id
  ), '[]'::jsonb) as categories
`;

export async function getAllProducts(): Promise<Product[]> {
  const rows = await getSql().query(`select ${productProjection} from products p order by p.name asc`);
  return rows as unknown as Product[];
}

export async function getAllCategories(quantity?: number): Promise<Category[]> {
  const limit = quantity && quantity > 0 ? Math.min(100, Math.floor(quantity)) : 100;
  const rows = await getSql().query(`
    select id as "_id", 'category'::text as "_type", created_at::text as "_createdAt",
      updated_at::text as "_updatedAt", revision as "_rev", title,
      jsonb_build_object('current', slug, '_type', 'slug') as slug, description, image
    from categories order by title asc nulls last limit $1
  `, [limit]);
  return rows as unknown as Category[];
}

export async function searchProductsByName(searchParam: string): Promise<Product[]> {
  const rows = await getSql().query(
    `select ${productProjection} from products p where p.name ilike $1 order by p.name asc`,
    [`%${searchParam}%`],
  );
  return rows as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await getSql().query(`select ${productProjection} from products p where p.slug = $1 limit 1`, [slug]);
  return (rows[0] as unknown as Product | undefined) ?? null;
}

export type ProductCategory = Pick<Category, "_id" | "title" | "slug">;

export async function getProductCategory(product: Product): Promise<ProductCategory | null> {
  const rows = await getSql().query(`
    select c.id as "_id", c.title, jsonb_build_object('current', c.slug, '_type', 'slug') as slug
    from categories c join product_categories pc on pc.category_id = c.id
    where pc.product_id = $1 order by c.title asc nulls last limit 1
  `, [product._id]);
  return (rows[0] as unknown as ProductCategory | undefined) ?? null;
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  const rows = await getSql().query(`
    select ${productProjection}
    from products p
    where p.id <> $1 and p.is_active = true and (
      exists (
        select 1 from product_categories candidate
        join product_categories current on current.category_id = candidate.category_id
        where candidate.product_id = p.id and current.product_id = $1
      ) or (not exists (select 1 from product_categories where product_id = $1) and p.variant = $2)
    )
    order by p.name asc limit 4
  `, [product._id, product.variant ?? ""]);
  return rows as unknown as Product[];
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const rows = await getSql().query(`
    select ${productProjection}
    from products p join product_categories pc_filter on pc_filter.product_id = p.id
    join categories c_filter on c_filter.id = pc_filter.category_id
    where c_filter.slug = $1 order by p.name asc
  `, [categorySlug]);
  return rows as unknown as Product[];
}

export async function getCatalogProducts(filters: { variant?: string; category?: string; search?: string }): Promise<Product[]> {
  const conditions = ["p.is_active = true"];
  const params: string[] = [];
  if (filters.variant) { params.push(filters.variant); conditions.push(`p.variant = $${params.length}`); }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`exists (select 1 from product_categories pc join categories c on c.id = pc.category_id where pc.product_id = p.id and c.slug = $${params.length})`);
  }
  if (filters.search) { params.push(`%${filters.search}%`); conditions.push(`p.name ilike $${params.length}`); }
  const rows = await getSql().query(`
    select ${productProjection} from products p
    where ${conditions.join(" and ")} order by p.name asc limit 100
  `, params);
  return rows as unknown as Product[];
}

export async function getMyOrders(userId: string): Promise<MY_ORDERS_QUERYResult> {
  if (!userId) throw new Error("User ID is required");
  const rows = await getSql().query(`
    select o.id as "_id", 'order'::text as "_type", o.created_at::text as "_createdAt",
      o.updated_at::text as "_updatedAt", o.revision as "_rev", o.order_number as "orderNumber",
      o.invoice, o.stripe_checkout_session_id as "stripeCheckoutSessionId",
      o.stripe_customer_id as "stripeCustomerId", o.clerk_user_id as "clerkUserId",
      o.customer_name as "customerName", o.email,
      o.stripe_payment_intent_id as "stripePaymentIntentId", o.total_price::float8 as "totalPrice",
      o.subtotal_cents as "subtotalCents", o.discount_cents as "discountCents",
      o.tax_base_cents as "taxBaseCents", o.itbms_cents as "itbmsCents",
      o.shipping_cents as "shippingCents", o.total_cents as "totalCents",
      o.refunded_cents as "refundedCents", o.inventory_reserved as "inventoryReserved",
      o.checkout_attempt_id as "checkoutAttemptId", o.cancelled_at::text as "cancelledAt",
      o.currency, o.amount_discount::float8 as "amountDiscount", o.status,
      o.order_date::text as "orderDate",
      coalesce((select jsonb_agg(jsonb_build_object(
        '_key', oi.id, 'productId', oi.product_id, 'quantity', oi.quantity,
        'nameSnapshot', oi.name_snapshot, 'skuSnapshot', oi.sku_snapshot,
        'variantSnapshot', oi.variant_snapshot, 'unitPriceCents', oi.unit_price_cents,
        'subtotalCents', oi.subtotal_cents, 'discountCents', oi.discount_cents,
        'itbmsCents', oi.itbms_cents, 'totalCents', oi.total_cents,
        'product', case when p.id is null then null else jsonb_build_object(
          '_id', p.id, '_type', 'product', 'name', p.name, 'images', p.images,
          'price', p.price::float8, 'discount', p.discount::float8,
          'slug', jsonb_build_object('current', p.slug, '_type', 'slug')
        ) end
      ) order by oi.id) from order_items oi left join products p on p.id = oi.product_id where oi.order_id = o.id), '[]'::jsonb) as products
    from orders o where o.clerk_user_id = $1 order by o.order_date desc
  `, [userId]);
  return rows as unknown as MY_ORDERS_QUERYResult;
}
