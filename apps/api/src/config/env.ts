import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * All configuration is validated at boot. A misconfigured deployment fails fast
 * with a readable error instead of failing at request time.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
    ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    AI_PROVIDER: z.enum(['gemini', 'mock']).default('mock'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_FAST_MODEL: z.string().default('gemini-2.5-flash'),
    GEMINI_SMART_MODEL: z.string().default('gemini-2.5-pro'),

    FREE_TIER_INTERVIEWS_PER_MONTH: z.coerce.number().int().nonnegative().default(3),

    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_UPLOAD_MB: z.coerce.number().positive().default(5),

    // Realtime collaboration (CodeSync rooms)
    REALTIME_PERSIST_DEBOUNCE_MS: z.coerce.number().int().positive().default(2000),
    REALTIME_AUTOSNAPSHOT_MS: z.coerce.number().int().positive().default(120_000),

    // Secure code execution
    EXECUTION_PROVIDER: z.enum(['mock', 'piston']).default('mock'),
    PISTON_URL: z.string().default('https://emkc.org/api/v2/piston'),
    EXEC_RUN_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
    EXEC_MEMORY_LIMIT_MB: z.coerce.number().int().nonnegative().default(256),
    EXEC_MAX_CODE_BYTES: z.coerce.number().int().positive().default(100_000),
  })
  .refine((e) => e.AI_PROVIDER !== 'gemini' || Boolean(e.GEMINI_API_KEY), {
    message: 'GEMINI_API_KEY is required when AI_PROVIDER=gemini',
    path: ['GEMINI_API_KEY'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
