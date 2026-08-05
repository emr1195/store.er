export function hasAdminRole(sessionClaims: unknown): boolean {
  if (!sessionClaims || typeof sessionClaims !== "object") return false;
  const claims = sessionClaims as Record<string, unknown>;
  const metadata = claims.metadata;
  const publicMetadata = claims.publicMetadata;
  const role = claims.role ?? readRole(metadata) ?? readRole(publicMetadata);
  return role === "admin";
}

function readRole(value: unknown): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>).role : undefined;
}
