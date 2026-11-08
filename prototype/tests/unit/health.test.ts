import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '@/app/api/v1/health/route';
import { resetConfigCache } from '@/lib/config';

interface HealthBody {
  requestId?: string;
  data: {
    status: string;
    service: string;
    uptimeSeconds: number;
    timestamp: string;
    checks: { config: string };
    llm: { enabled: boolean; configured: boolean };
  };
  error: { code: string };
}
const call = () => GET(new Request('http://localhost/api/v1/health'));

beforeEach(() => {
  resetConfigCache();
});
afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigCache();
});

describe('GET /api/v1/health', () => {
  it('returns ok with safe fields only', async () => {
    vi.stubEnv('LLM_ENABLED', 'false');
    const res = await call();
    const body = (await res.json()) as HealthBody;
    expect(res.status).toBe(200);
    expect(body.requestId).toBeTruthy();
    expect(body.data.status).toBe('ok');
    expect(body.data.service).toBe('sip-steady');
    expect(body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.data.timestamp).toBeTruthy();
    expect(body.data.checks.config).toBe('ok');
    expect(body.data.llm).toEqual({ enabled: false, configured: false });
  });

  it('never exposes the LLM key', async () => {
    vi.stubEnv('LLM_ENABLED', 'true');
    vi.stubEnv('LLM_PROVIDER', 'some-provider');
    vi.stubEnv('LLM_MODEL', 'some-model');
    vi.stubEnv('LLM_API_KEY', 'sk-do-not-leak-me');
    const text = await (await call()).text();
    expect(text).not.toContain('sk-do-not-leak-me');
    expect(text).not.toContain('some-provider');
    expect(JSON.parse(text).data.llm).toEqual({ enabled: true, configured: true });
  });

  it('reports a calm CONFIG_ERROR when the environment is invalid', async () => {
    vi.stubEnv('LLM_ENABLED', 'true');
    vi.stubEnv('LLM_PROVIDER', '');
    vi.stubEnv('LLM_MODEL', '');
    vi.stubEnv('LLM_API_KEY', '');
    const res = await call();
    const body = (await res.json()) as HealthBody;
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('CONFIG_ERROR');
    expect(JSON.stringify(body)).not.toContain('LLM_API_KEY');
  });
});
