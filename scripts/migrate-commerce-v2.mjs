import { createClient } from "@sanity/client";

const execute = process.argv.includes("--execute");
const required = ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET", "NEXT_PUBLIC_SANITY_API_VERSION", "SANITY_API_TOKEN"];
for (const name of required) if (!process.env[name]) throw new Error(`Missing ${name}`);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const products = await client.fetch(`*[_type == "product" && (!defined(isActive) || !defined(taxable))]{_id,isActive,taxable}`);
const orders = await client.fetch(`*[_type == "order" && !defined(totalCents)]{_id,totalPrice,amountDiscount}`);
console.log(JSON.stringify({ mode: execute ? "execute" : "dry-run", products: products.length, orders: orders.length }));

if (execute) {
  let transaction = client.transaction();
  for (const product of products) {
    transaction = transaction.patch(product._id, { setIfMissing: { isActive: true, taxable: true } });
  }
  for (const order of orders) {
    const totalCents = Math.max(0, Math.round((order.totalPrice ?? 0) * 100));
    const discountCents = Math.max(0, Math.round((order.amountDiscount ?? 0) * 100));
    transaction = transaction.patch(order._id, { setIfMissing: { totalCents, discountCents } });
  }
  await transaction.commit();
  console.log("Migration completed");
}
