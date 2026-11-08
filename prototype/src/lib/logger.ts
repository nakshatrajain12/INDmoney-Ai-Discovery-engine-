/**
 * Minimal structured JSON logger with redaction.
 * Never log raw secrets or personal data: keys that look sensitive are redacted and
 * emails / long digit runs (phones, account numbers) inside strings are masked.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY = /(key|secret|token|password|authorization|cookie|pan|account|phone|email)/i;

export function maskString(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[EMAIL]')
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[PAN]')
    .replace(/\b\d{9,}\b/g, '[NUMBER]');
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[DEEP]';
  if (typeof value === 'string') return maskString(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[REDACTED]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}

export function createLogger(
  opts: { level?: LogLevel; sink?: (line: string) => void; base?: Record<string, unknown> } = {}
): Logger {
  const level = opts.level ?? ((process.env.LOG_LEVEL as LogLevel) || 'info');
  const sink = opts.sink ?? ((l: string) => console.log(l));
  const emit = (lvl: LogLevel, msg: string, fields?: Record<string, unknown>) => {
    if (ORDER[lvl] < ORDER[level]) return;
    sink(JSON.stringify({ ts: new Date().toISOString(), level: lvl, msg: maskString(msg), ...(redact({ ...opts.base, ...fields }) as object) }));
  };
  return {
    debug: (m, f) => emit('debug', m, f),
    info: (m, f) => emit('info', m, f),
    warn: (m, f) => emit('warn', m, f),
    error: (m, f) => emit('error', m, f)
  };
}

export const logger = createLogger();
