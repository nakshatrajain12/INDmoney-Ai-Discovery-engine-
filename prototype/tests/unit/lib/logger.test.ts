import { describe, it, expect } from 'vitest';
import { createLogger, redact, maskString } from '@/lib/logger';

describe('logger', () => {
  it('redacts sensitive keys and masks personal data in strings', () => {
    const out = redact({ apiKey: 'sk-123', nested: { password: 'pw', note: 'mail me at a.b@example.com PAN ABCDE1234F acct 123456789012' }, ok: 'fine' }) as { apiKey: string; nested: { password: string; note: string }; ok: string };
    expect(out.apiKey).toBe('[REDACTED]');
    expect(out.nested.password).toBe('[REDACTED]');
    expect(out.nested.note).toContain('[EMAIL]');
    expect(out.nested.note).toContain('[PAN]');
    expect(out.nested.note).toContain('[NUMBER]');
    expect(out.nested.note).not.toContain('example.com');
    expect(out.ok).toBe('fine');
  });

  it('writes one JSON line per event and respects the level', () => {
    const lines: string[] = [];
    const log = createLogger({ level: 'warn', sink: (l) => lines.push(l) });
    log.info('hidden');
    log.warn('shown', { requestId: 'r1', authorization: 'Bearer abc' });
    expect(lines).toHaveLength(1);
    const rec = JSON.parse(lines[0]!);
    expect(rec.level).toBe('warn');
    expect(rec.requestId).toBe('r1');
    expect(rec.authorization).toBe('[REDACTED]');
    expect(lines[0]).not.toContain('Bearer abc');
  });

  it('masks long digit runs but keeps ordinary numbers', () => {
    expect(maskString('paid 5000 on 2026-11-08')).toBe('paid 5000 on 2026-11-08');
    expect(maskString('acct 1234567890')).toBe('acct [NUMBER]');
  });
});
