import { Pool } from "pg";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!clerkSecretKey) throw new Error("CLERK_SECRET_KEY no está configurada");
if (!databaseUrl) throw new Error("DATABASE_URL no está configurada");

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  allowExitOnIdle: true,
  ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

let offset = 0;
let migratedUsers = 0;
let migratedGoogleAccounts = 0;

try {
  while (true) {
    const response = await fetch(`https://api.clerk.com/v1/users?limit=100&offset=${offset}`, {
      headers: { Authorization: `Bearer ${clerkSecretKey}` },
    });
    if (!response.ok) throw new Error(`Clerk devolvió HTTP ${response.status}`);

    const users = await response.json();
    if (!Array.isArray(users)) throw new Error("Clerk devolvió una respuesta inesperada");
    if (users.length === 0) break;

    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const clerkUser of users) {
        const primaryEmail = clerkUser.email_addresses?.find(
          (entry) => entry.id === clerkUser.primary_email_address_id,
        ) ?? clerkUser.email_addresses?.[0];
        if (!primaryEmail?.email_address) continue;

        const role = readRole(clerkUser) === "admin" ? "admin" : "user";
        const name = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ")
          || primaryEmail.email_address.split("@")[0]
          || "Usuario";

        await client.query(`
          insert into "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned)
          values ($1,$2,$3,$4,$5,$6,$7,$8,false)
          on conflict (id) do update set
            name = excluded.name,
            email = excluded.email,
            "emailVerified" = excluded."emailVerified",
            image = excluded.image,
            "updatedAt" = excluded."updatedAt",
            role = excluded.role
        `, [
          clerkUser.id,
          name,
          primaryEmail.email_address.toLowerCase(),
          primaryEmail.verification?.status === "verified",
          clerkUser.image_url ?? null,
          new Date(clerkUser.created_at ?? Date.now()),
          new Date(clerkUser.updated_at ?? Date.now()),
          role,
        ]);
        migratedUsers += 1;

        for (const externalAccount of clerkUser.external_accounts ?? []) {
          if (externalAccount.provider !== "oauth_google" || !externalAccount.provider_user_id) continue;
          await client.query(`
            insert into account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
            values ($1,$2,'google',$3,$4,$5)
            on conflict (id) do update set
              "accountId" = excluded."accountId",
              "providerId" = excluded."providerId",
              "userId" = excluded."userId",
              "updatedAt" = excluded."updatedAt"
          `, [
            `clerk.${externalAccount.id}`,
            externalAccount.provider_user_id,
            clerkUser.id,
            new Date(externalAccount.created_at ?? clerkUser.created_at ?? Date.now()),
            new Date(externalAccount.updated_at ?? clerkUser.updated_at ?? Date.now()),
          ]);
          migratedGoogleAccounts += 1;
        }
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }

    offset += users.length;
    if (users.length < 100) break;
  }

  await pool.query(`
    insert into data_migrations (id, source, details, completed_at)
    values ('clerk-to-better-auth-v1','clerk',$1::jsonb,now())
    on conflict (id) do update set details = excluded.details, completed_at = excluded.completed_at
  `, [JSON.stringify({ migratedUsers, migratedGoogleAccounts })]);

  console.log(JSON.stringify({ migratedUsers, migratedGoogleAccounts }));
} finally {
  await pool.end();
}

function readRole(user) {
  return user.public_metadata?.role
    ?? user.private_metadata?.role
    ?? user.unsafe_metadata?.role;
}
