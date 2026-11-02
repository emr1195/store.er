import { getMigrations } from "better-auth/db/migration";
import { admin } from "better-auth/plugins/admin";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL no está configurada");

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  allowExitOnIdle: true,
  ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

try {
  const migration = await getMigrations({
    database: pool,
    plugins: [admin()],
  });

  if (migration.schemaProblems.length > 0) {
    throw new Error(`Esquema incompatible: ${migration.schemaProblems.join("; ")}`);
  }

  await migration.runMigrations();
  console.log(JSON.stringify({
    createdTables: migration.toBeCreated.map(({ table }) => table),
    updatedTables: migration.toBeAdded.map(({ table }) => table),
    addedIndexes: migration.toBeAddedIndexes.map(({ name }) => name),
  }));
} finally {
  await pool.end();
}
