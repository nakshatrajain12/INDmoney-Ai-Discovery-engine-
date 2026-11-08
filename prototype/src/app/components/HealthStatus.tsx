'use client';

import { useEffect, useState } from 'react';

interface Health {
  status: string;
  service: string;
  version: string;
  env: string;
  llm: { enabled: boolean };
}

type State = { kind: 'loading' } | { kind: 'ok'; health: Health; requestId: string } | { kind: 'error' };

async function fetchHealth(): Promise<State> {
  try {
    const r = await fetch('/api/v1/health', { cache: 'no-store' });
    if (!r.ok) return { kind: 'error' };
    const body = (await r.json()) as { requestId: string; data: Health };
    return { kind: 'ok', health: body.data, requestId: body.requestId };
  } catch {
    return { kind: 'error' };
  }
}

/** Proves the frontend talks to the backend. Replaced by real screens in Phase 6. */
export function HealthStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchHealth().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recheck = () => {
    setState({ kind: 'loading' });
    fetchHealth().then(setState);
  };

  return (
    <section aria-labelledby="health-h" className="rounded-ind-lg border border-line bg-s1 p-4 shadow-ind-card">
      <h2 id="health-h" className="text-lg font-semibold">Environment check</h2>
      <div id="health-status" role="status" aria-live="polite" className="mt-2 text-sm text-t2">
        {state.kind === 'loading' && 'Checking the backend…'}
        {state.kind === 'error' && 'We can’t reach the backend right now.'}
        {state.kind === 'ok' && (
          <span>
            Backend connected · {state.health.service} v{state.health.version} · {state.health.env} · LLM{' '}
            {state.health.llm.enabled ? 'on' : 'off (templates only)'}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={recheck}
        className="mt-3 inline-flex min-h-[44px] items-center rounded-ind-md border border-line bg-s2 px-4 text-sm font-semibold hover:bg-elev"
      >
        Check again
      </button>
    </section>
  );
}
