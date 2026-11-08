import { withApi } from '@/lib/api';
import { getConfig, publicConfigView } from '@/lib/config';
import { today } from '@/lib/clock';

export const dynamic = 'force-dynamic';

/** Liveness and readiness. Returns booleans and labels only: never a secret or a raw config value. */
export const GET = withApi(() => {
  const cfg = getConfig(); // throws ConfigError (mapped to CONFIG_ERROR) if the environment is invalid
  const view = publicConfigView(cfg);
  return {
    status: 'ok' as const,
    service: 'sip-steady',
    version: '0.1.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: view.env,
    today: today(),
    checks: { config: 'ok' as const },
    llm: view.llm,
    demoPanel: view.demoPanel
  };
});
