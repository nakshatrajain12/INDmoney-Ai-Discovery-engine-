import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { withApi } from '@/lib/api';
import { conflict, invalidInput, notFound, providerUnavailable } from '@/lib/errors';
import { ConfigError } from '@/lib/config';

const req = (headers: Record<string, string> = {}) => new Request('http://localhost/api/v1/x', { headers });
interface Body {
  requestId: string;
  data?: unknown;
  error: { code: string; retryable: boolean; message: string };
}
const json = async (r: Response) => (await r.json()) as Body;

describe('withApi', () => {
  it('wraps success as { requestId, data } and echoes a supplied request id', async () => {
    const res = await withApi(() => ({ hello: 'world' }))(req({ 'x-request-id': 'req-123' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBe('req-123');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await json(res)).toEqual({ requestId: 'req-123', data: { hello: 'world' } });
  });

  it('generates a request id when none is supplied', async () => {
    const b = await json(await withApi(() => 1)(req()));
    expect(typeof b.requestId).toBe('string');
    expect(b.requestId.length).toBeGreaterThan(8);
  });

  it.each([
    [invalidInput('Enter an amount greater than zero.'), 400, 'INVALID_INPUT', false],
    [notFound(), 404, 'NOT_FOUND', false],
    [conflict('Your SIP is already paused.'), 409, 'CONFLICT', false],
    [providerUnavailable(), 503, 'PROVIDER_UNAVAILABLE', true]
  ])('maps AppError to the calm envelope (%#)', async (err, status, code, retryable) => {
    const res = await withApi(() => {
      throw err;
    })(req());
    const b = await json(res);
    expect(res.status).toBe(status);
    expect(b.error.code).toBe(code);
    expect(b.error.retryable).toBe(retryable);
    expect(typeof b.error.message).toBe('string');
    expect(b.requestId).toBeTruthy();
  });

  it('maps validation errors to 400 without leaking field internals', async () => {
    const res = await withApi(() => z.object({ n: z.number() }).parse({ n: 'x' }))(req());
    const b = await json(res);
    expect(res.status).toBe(400);
    expect(b.error.code).toBe('INVALID_INPUT');
    expect(JSON.stringify(b)).not.toContain('Expected number');
  });

  it('maps config errors and unknown errors without exposing internals', async () => {
    const c = await withApi(() => {
      throw new ConfigError(['LLM_API_KEY: required']);
    })(req());
    expect((await json(c)).error.code).toBe('CONFIG_ERROR');

    const u = await withApi(() => {
      throw new Error('database password is hunter2 at /srv/app/secret.js:12');
    })(req());
    const body = await json(u);
    expect(u.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL');
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(JSON.stringify(body)).not.toContain('/srv/app');
  });
});
