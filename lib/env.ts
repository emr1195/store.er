import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1),
  SANITY_API_TOKEN: z.string().min(1),
  SANITY_API_READ_TOKEN: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STORE_CURRENCY: z.literal("USD").default("USD"),
  NEXT_PUBLIC_ITBMS_RATE: z.coerce.number().min(0).max(1).default(0.07),
  NEXT_PUBLIC_STANDARD_SHIPPING_CENTS: z.coerce.number().int().nonnegative().default(0),
});

export function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Variables de entorno inválidas o ausentes: ${missing}`);
  }
  return result.data;
}
