import { z } from 'zod';
import { loadRootEnv } from './load-env';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  ALLOW_DEV_AUTH: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  STORAGE_LOCAL_PATH: z.string().default('./storage/uploads'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_CSE_API_KEY: z.string().optional(),
  GOOGLE_CSE_CX: z.string().optional(),
  BING_SEARCH_KEY: z.string().optional(),
  /** Budget caps — Chunk C1 acquisition control */
  PLACES_MONTHLY_CAP: z.string().optional(),
  CSE_DAILY_CAP: z.string().optional(),
  BING_DAILY_CAP: z.string().optional(),
  BROWSER_DAILY_CAP: z.string().optional(),
  CUSTOM_SCRAPE_DAILY_CAP: z.string().optional(),
  ACQUISITION_MODE: z.enum(['economy', 'standard', 'boost']).optional(),
  BROWSER_AUTOMATION_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  CUSTOM_SCRAPE_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  loadRootEnv();
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return cached;
}

export function isDevAuthEnabled(): boolean {
  return process.env.ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production';
}
