import { neon, Pool, type NeonQueryFunction, type PoolClient } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let pool: Pool | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (sqlClient) return sqlClient;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no está configurada");
  sqlClient = neon(databaseUrl);
  return sqlClient;
}

function getPool(): Pool {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no está configurada");
  pool = new Pool({ connectionString: databaseUrl });
  return pool;
}

export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
