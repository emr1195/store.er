import { createClient } from "@sanity/client";
import { neon } from "@neondatabase/serverless";

const required = [
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "NEXT_PUBLIC_SANITY_API_VERSION",
  "DATABASE_URL",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});
const sql = neon(process.env.DATABASE_URL);

const sanityTypes = [
  "category",
  "product",
  "order",
  "orderAudit",
  "inventoryMovement",
  "webhookEvent",
];

const sanityCounts = Object.fromEntries(
  await Promise.all(
    sanityTypes.map(async (type) => [
      type,
      await sanity.fetch("count(*[_type == $type])", { type }),
    ]),
  ),
);

const tables = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;

const expectedTables = [
  "categories",
  "products",
  "orders",
  "order_items",
  "order_audits",
  "inventory_movements",
  "webhook_events",
];
const existingTableNames = new Set(tables.map(({ table_name: tableName }) => tableName));
const neonCounts = {};
for (const table of expectedTables) {
  if (!existingTableNames.has(table)) continue;
  const [row] = await sql.query(`select count(*)::int as count from ${table}`);
  neonCounts[table] = row.count;
}

console.log(JSON.stringify({
  sanity: sanityCounts,
  neon: neonCounts,
  neonTables: [...existingTableNames],
}, null, 2));
