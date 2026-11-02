import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!databaseUrl) throw new Error("DATABASE_URL no está configurada");
if (!email || !email.includes("@")) {
  throw new Error("SUPER_ADMIN_EMAIL no está configurado o no es válido");
}
if (!password || password.length < 16) {
  throw new Error("SUPER_ADMIN_PASSWORD debe tener al menos 16 caracteres");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  allowExitOnIdle: true,
  ssl: databaseUrl.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

const client = await pool.connect();

try {
  await client.query("begin");

  const existingUser = await client.query(
    `select id from "user" where lower(email) = $1 for update`,
    [email],
  );

  const userId = existingUser.rows[0]?.id ?? randomUUID();
  const now = new Date();

  if (existingUser.rowCount === 0) {
    await client.query(
      `insert into "user"
        (id, name, email, "emailVerified", "createdAt", "updatedAt", role, banned)
       values ($1, 'Super Admin', $2, true, $3, $3, 'admin', false)`,
      [userId, email, now],
    );
  } else {
    await client.query(
      `update "user"
       set role = 'admin',
           "emailVerified" = true,
           banned = false,
           "banReason" = null,
           "banExpires" = null,
           "updatedAt" = $2
       where id = $1`,
      [userId, now],
    );
  }

  const hashedPassword = await hashPassword(password);
  const credentialAccount = await client.query(
    `select id from account
     where "userId" = $1 and "providerId" = 'credential'
     for update`,
    [userId],
  );

  if (credentialAccount.rowCount === 0) {
    await client.query(
      `insert into account
        (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       values ($1, $2, 'credential', $2, $3, $4, $4)`,
      [`credential.${randomUUID()}`, userId, hashedPassword, now],
    );
  } else {
    await client.query(
      `update account
       set password = $2, "updatedAt" = $3
       where id = $1`,
      [credentialAccount.rows[0].id, hashedPassword, now],
    );
  }

  await client.query("commit");
  console.log(JSON.stringify({
    success: true,
    created: existingUser.rowCount === 0,
    role: "admin",
    credentialReady: true,
  }));
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
