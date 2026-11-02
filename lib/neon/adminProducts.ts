import { getSql } from "@/lib/db";

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  intro: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  sku: string;
  isActive: boolean;
  taxable: boolean;
  status: string;
  variant: string;
  updatedAt: string;
};

export type AdminProductInput = Omit<AdminProduct, "id" | "updatedAt">;

const adminProductProjection = `
  id, name, slug, images, intro, description, price::float8 as price,
  discount::float8 as discount, stock, coalesce(sku, '') as sku,
  is_active as "isActive", taxable, coalesce(status, '') as status,
  coalesce(variant, '') as variant, updated_at::text as "updatedAt"
`;

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const rows = await getSql().query(`select ${adminProductProjection} from products order by updated_at desc, name asc`);
  return rows.map(mapAdminProduct);
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const rows = await getSql().query(`select ${adminProductProjection} from products where id = $1 limit 1`, [id]);
  return rows[0] ? mapAdminProduct(rows[0]) : null;
}

export async function createAdminProduct(input: AdminProductInput): Promise<string> {
  const id = `product.${crypto.randomUUID()}`;
  await getSql().query(`
    insert into products (id, revision, name, slug, images, intro, description, price, discount,
      stock, sku, is_active, taxable, status, variant, created_at, updated_at)
    values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),now())
  `, [id, crypto.randomUUID(), input.name, input.slug, JSON.stringify(toStoredImages(input.imageUrls)),
    input.intro || null, input.description || null, input.price, input.discount, input.stock,
    input.sku || null, input.isActive, input.taxable, input.status || null, input.variant || null]);
  return id;
}

export async function updateAdminProduct(id: string, input: AdminProductInput): Promise<void> {
  const rows = await getSql().query(`
    update products set revision = $1, name = $2, slug = $3, images = $4::jsonb,
      intro = $5, description = $6, price = $7, discount = $8, stock = $9,
      sku = $10, is_active = $11, taxable = $12, status = $13, variant = $14, updated_at = now()
    where id = $15 returning id
  `, [crypto.randomUUID(), input.name, input.slug, JSON.stringify(toStoredImages(input.imageUrls)),
    input.intro || null, input.description || null, input.price, input.discount, input.stock,
    input.sku || null, input.isActive, input.taxable, input.status || null, input.variant || null, id]);
  if (!rows[0]) throw new Error("PRODUCT_NOT_FOUND");
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const rows = await getSql().query("delete from products where id = $1 returning id", [id]);
  if (!rows[0]) throw new Error("PRODUCT_NOT_FOUND");
}

function mapAdminProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    imageUrls: readImageUrls(row.images),
    intro: String(row.intro ?? ""),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    discount: Number(row.discount ?? 0),
    stock: Number(row.stock ?? 0),
    sku: String(row.sku ?? ""),
    isActive: Boolean(row.isActive),
    taxable: Boolean(row.taxable),
    status: String(row.status ?? ""),
    variant: String(row.variant ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
  };
}

function readImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((image) => {
    if (!image || typeof image !== "object") return [];
    const url = (image as Record<string, unknown>).url;
    if (typeof url === "string" && url.startsWith("https://")) return [url];
    const asset = (image as { asset?: { _ref?: unknown } }).asset;
    if (typeof asset?._ref === "string") return [`sanity:${asset._ref}`];
    return [];
  });
}

function toStoredImages(urls: string[]): Array<Record<string, unknown>> {
  return urls.map((url, index) => url.startsWith("sanity:")
    ? { _key: `image-${index}`, _type: "image", asset: { _ref: url.slice(7), _type: "reference" } }
    : { _key: `external-${index}`, _type: "externalImage", url });
}
