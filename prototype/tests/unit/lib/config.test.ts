import { describe, it, expect } from 'vitest';
import { loadConfig, publicConfigView, ConfigError } from '@/lib/config';

describe('config loader', () => {
  it('applies safe defaults: LLM off, demo panel on, development', () => {
    const c = loadConfig({});
    expect(c.APP_ENV).toBe('development');
    expect(c.LLM_ENABLED).toBe(false);
    expect(c.DEMO_PANEL).toBe(true);
    expect(c.LOG_LEVEL).toBe('info');
  });

  it('treats empty strings (as in .env.example) as unset', () => {
    const c = loadConfig({ LLM_ENABLED: 'false', LLM_PROVIDER: '', LLM_MODEL: '', LLM_API_KEY: '', DEMO_PANEL: 'true' });
    expect(c.LLM_PROVIDER).toBeUndefined();
    expect(c.LLM_ENABLED).toBe(false);
  });

  it('requires provider, model and key when the LLM is enabled', () => {
    expect(() => loadConfig({ LLM_ENABLED: 'true' })).toThrow(ConfigError);
    try {
      loadConfig({ LLM_ENABLED: 'true', LLM_PROVIDER: 'x' });
    } catch (e) {
      const msg = (e as ConfigError).issues.join(' ');
      expect(msg).toContain('LLM_MODEL');
      expect(msg).toContain('LLM_API_KEY');
    }
    expect(loadConfig({ LLM_ENABLED: 'true', LLM_PROVIDER: 'p', LLM_MODEL: 'm', LLM_API_KEY: 'k' }).LLM_ENABLED).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(() => loadConfig({ APP_ENV: 'staging' })).toThrow(ConfigError);
    expect(() => loadConfig({ LOG_LEVEL: 'loud' })).toThrow(ConfigError);
    expect(() => loadConfig({ LLM_ENABLED: 'maybe' })).toThrow(ConfigError);
  });

  it('returns a frozen object', () => {
    const c = loadConfig({});
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('public view never contains a secret value', () => {
    const c = loadConfig({ LLM_ENABLED: 'true', LLM_PROVIDER: 'prov', LLM_MODEL: 'mod', LLM_API_KEY: 'sk-super-secret', DATABASE_URL: 'postgres://user:pw@host/db' });
    const view = JSON.stringify(publicConfigView(c));
    expect(view).not.toContain('sk-super-secret');
    expect(view).not.toContain('pw@host');
    expect(view).not.toContain('prov');
    expect(publicConfigView(c).llm).toEqual({ enabled: true, configured: true });
  });
});
