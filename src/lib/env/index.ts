import { z } from "zod";

/**
 * Typed, validated environment (APP_SPEC §11: the app fails fast if a required
 * variable is missing; secrets live only on the server).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

/** Validate a raw env bag; throws naming the offending variable(s). */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const vars = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${vars}`);
  }
  return parsed.data;
}

let cached: Env | undefined;

/** Memoized validated env. The first call fails fast on a bad environment. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
