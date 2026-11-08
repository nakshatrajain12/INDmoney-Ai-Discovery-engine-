import { z } from 'zod';

/**
 * Runtime configuration. Server-side only.
 * Secrets (LLM_API_KEY) must never reach the browser: they are not NEXT_PUBLIC_ variables and
 * `publicConfigView()` exposes booleans only.
 */
const bool = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z
  .object({
    APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    DEMO_PANEL: z
      .enum(['true', 'false', '1', '0', ''])
      .optional()
      .transform((v) => (v === undefined || v === '' ? true : v === 'true' || v === '1')),
    LLM_ENABLED: bool,
    LLM_PROVIDER: z.string().trim().optional(),
    LLM_MODEL: z.string().trim().optional(),
    LLM_API_KEY: z.string().trim().optional(),
    DATABASE_URL: z.string().trim().optional()
  })
  .superRefine((v, ctx) => {
    if (v.LLM_ENABLED) {
      for (const k of ['LLM_PROVIDER', 'LLM_MODEL', 'LLM_API_KEY'] as const) {
        if (!v[k]) ctx.addIssue({ code: 'custom', path: [k], message: `${k} is required when LLM_ENABLED=true` });
      }
    }
  });

export type AppConfig = Readonly<z.infer<typeof schema>>;

export class ConfigError extends Error {
  constructor(public readonly issues: string[]) {
    super('Invalid configuration: ' + issues.join('; '));
    this.name = 'ConfigError';
  }
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = schema.safeParse({
    APP_ENV: env.APP_ENV || undefined,
    LOG_LEVEL: env.LOG_LEVEL || undefined,
    DEMO_PANEL: env.DEMO_PANEL,
    LLM_ENABLED: env.LLM_ENABLED,
    LLM_PROVIDER: env.LLM_PROVIDER || undefined,
    LLM_MODEL: env.LLM_MODEL || undefined,
    LLM_API_KEY: env.LLM_API_KEY || undefined,
    DATABASE_URL: env.DATABASE_URL || undefined
  });
  if (!parsed.success) {
    throw new ConfigError(parsed.error.issues.map((i) => `${i.path.join('.') || 'config'}: ${i.message}`));
  }
  return Object.freeze(parsed.data);
}

let cached: AppConfig | null = null;
export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}
export function resetConfigCache(): void {
  cached = null;
}

export function getLlmApiKey(): string | undefined {
  return getConfig().LLM_API_KEY;
}

/** Safe summary for health checks and the UI. Never includes a secret value. */
export function publicConfigView(cfg: AppConfig = getConfig()) {
  return {
    env: cfg.APP_ENV,
    demoPanel: cfg.DEMO_PANEL,
    llm: { enabled: cfg.LLM_ENABLED, configured: Boolean(cfg.LLM_PROVIDER && cfg.LLM_MODEL && cfg.LLM_API_KEY) },
    databaseConfigured: Boolean(cfg.DATABASE_URL)
  };
}
