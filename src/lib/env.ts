import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AWS_REGION: z.string().min(1).optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_S3_BUCKET_NAME: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  UPSTASH_REDIS_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URLS: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

function logOptionalServiceStatus(validEnv: Env): void {
  const optionalServices = {
    stripe: Boolean(validEnv.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(validEnv.STRIPE_WEBHOOK_SECRET),
    s3: Boolean(validEnv.AWS_REGION && validEnv.AWS_ACCESS_KEY_ID && validEnv.AWS_SECRET_ACCESS_KEY && validEnv.AWS_S3_BUCKET_NAME),
    redis: Boolean(validEnv.UPSTASH_REDIS_URL),
    supabase: Boolean(validEnv.SUPABASE_URL && validEnv.SUPABASE_KEY),
  };

  const disabledServices = Object.entries(optionalServices)
    .filter(([, enabled]) => !enabled)
    .map(([service]) => service);

  if (disabledServices.length > 0) {
    console.warn(`⚠️ Optional services not configured: ${disabledServices.join(", ")}`);
  }
}


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
    logOptionalServiceStatus(env);
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
