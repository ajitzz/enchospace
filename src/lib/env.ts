import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET_NAME: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  UPSTASH_REDIS_URL: z.string().url(),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URLS: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  try {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const missingVars = Object.keys(errors).join(", ");
      console.error("❌ Invalid environment variables. Missing or invalid:", missingVars);
      console.error("Details:", JSON.stringify(errors, null, 2));
      throw new Error(`Invalid environment variables: ${missingVars}`);
    }
    env = result.data;
    return env;
  } catch (error) {
    console.error("Critical failure during environment validation:", error);
    process.exit(1);
  }
}

export function getEnv(): Env {
  if (!env) {
    return validateEnv();
  }
  return env;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
