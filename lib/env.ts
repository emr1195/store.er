import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().url(),
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
}).superRefine((env, context) => {
  if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
    context.addIssue({
      code: "custom",
      path: ["GOOGLE_CLIENT_ID"],
      message: "GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben configurarse juntos",
    });
  }
});

export function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Variables de entorno inválidas o ausentes: ${missing}`);
  }
  return result.data;
}
