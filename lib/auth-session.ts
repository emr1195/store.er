import { headers } from "next/headers";
import { auth, type AuthSession } from "@/lib/auth";

export async function getServerSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireServerSession(): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  return session;
}

export async function requireAdminSession(): Promise<AuthSession> {
  const session = await requireServerSession();
  if (!hasAdminRole(session.user.role)) throw new Error("ADMIN_REQUIRED");
  return session;
}

export function hasAdminRole(role: unknown): boolean {
  if (typeof role !== "string") return false;
  return role.split(",").some((value) => value.trim() === "admin");
}
