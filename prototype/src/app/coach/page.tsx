'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { formatRupees, formatSignedRupees, formatPercent } from '@/lib/utils';
import type { SipSummary } from '@/contracts/api';

interface SipCoachOption {
  summary: SipSummary;
  investedPaise: number;
  currentValuePaise: number;
  absReturnPaise: number;
  absReturnBps: number | null;
  xirrBps: number | null;
  instalmentCount: number;
}

export default function GlobalCoachPage() {
  const { personaKey, asOf, hideAmounts } = useDemo();
  const [sips, setSips] = useState<SipCoachOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSips() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/sips?persona=${personaKey}&asOf=${asOf}`);
        if (!res.ok) throw new Error('Failed to load SIPs');
        const json = await res.json();
        const list: SipSummary[] = json.data || [];

        const loaded = await Promise.all(
          list
            .filter(s => s.status !== 'CANCELLED')
            .map(async s => {
              try {
                const metricsRes = await fetch(`/api/v1/sips/${s.id}/metrics?asOf=${asOf}`);
                const mJson = metricsRes.ok ? await metricsRes.json() : null;
                const m = mJson?.data?.metrics;
                return {
                  summary: s,
                  investedPaise: m?.investedPaise ?? s.instalmentAmountPaise,
                  currentValuePaise: m?.currentValuePaise ?? s.instalmentAmountPaise,
                  absReturnPaise: m?.absoluteReturnPaise ?? 0,
                  absReturnBps: m?.absoluteReturnPct ?? null,
                  xirrBps: m?.xirrPct ?? null,
                  instalmentCount: m?.instalmentsPaid ?? 1
                };
              } catch {
                return {
                  summary: s,
                  investedPaise: s.instalmentAmountPaise,
                  currentValuePaise: s.instalmentAmountPaise,
                  absReturnPaise: 0,
                  absReturnBps: null,
                  xirrBps: null,
                  instalmentCount: 1
                };
              }
            })
        );

        if (!cancelled) setSips(loaded);
      } catch (err) {
        console.error('Failed to load coach SIPs:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadSips();

    return () => {
      cancelled = true;
    };
  }, [personaKey, asOf]);

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      <AppHeader title="Return Coach" eyebrow="Understand My Returns" showBack backHref="/" />

      <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card">
        <div className="flex items-center gap-2 text-ind-emerald-text text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          <span>Factual Reassurance</span>
        </div>
        <h1 className="text-base font-bold text-t1 tracking-tight mt-1">
          Select a SIP to understand
        </h1>
        <p className="text-xs text-t2 mt-1 leading-relaxed">
          See what your own figures mean at your stage, in plain words. Zero financial advice.
        </p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-s1 p-8 text-center text-xs text-t2 space-y-2">
            <div className="h-4 w-24 mx-auto rounded bg-s2 animate-pulse" />
            <div>Loading active SIPs...</div>
          </div>
        ) : sips.length === 0 ? (
          <div className="rounded-2xl border border-border bg-s1 p-6 text-center text-xs text-t2">
            No active SIPs available to explain.
          </div>
        ) : (
          sips.map(s => (
            <Link
              key={s.summary.id}
              href={`/sip/${s.summary.id}/coach`}
              className="block min-h-[44px] rounded-2xl border border-border bg-s1 p-4 shadow-ind-card transition-all hover:border-ind-blue/40 focus-visible:outline-2 focus-visible:outline-focus"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-t1 tracking-tight">
                    {s.summary.schemeName}
                  </h2>
                  <p className="text-[11px] text-t3 mt-0.5">
                    {s.summary.category} · {s.instalmentCount} instalments paid
                  </p>
                </div>
                <StatusChip status="ACTIVE" size="sm" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-s2 p-2">
                  <span className="text-[10px] uppercase text-t3 font-semibold">Invested</span>
                  <div className="font-bold tabular-nums text-t1">
                    {formatRupees(s.investedPaise, hideAmounts)}
                  </div>
                </div>

                <div className="rounded-xl bg-s2 p-2">
                  <span className="text-[10px] uppercase text-t3 font-semibold">Current Value</span>
                  <div className="font-bold tabular-nums text-t1">
                    {formatRupees(s.currentValuePaise, hideAmounts)}
                  </div>
                </div>

                <div className="rounded-xl bg-s2 p-2">
                  <span className="text-[10px] uppercase text-t3 font-semibold">Return</span>
                  <div className="font-bold tabular-nums text-t1">
                    {hideAmounts
                      ? '••••••'
                      : `${formatSignedRupees(s.absReturnPaise, false)} (${formatPercent(s.absReturnBps)})`}
                  </div>
                </div>

                <div className="rounded-xl bg-s2 p-2">
                  <span className="text-[10px] uppercase text-t3 font-semibold">XIRR</span>
                  <div className="font-bold tabular-nums text-t1">
                    {s.xirrBps == null ? 'unavailable' : formatPercent(s.xirrBps)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-ind-blue font-semibold pt-2 border-t border-border/40">
                <span>Explain these figures</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-s2 p-3 text-xs text-t3 leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-t2 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Return Coach explains how returns are calculated at your tenure stage. Does not predict future prices or provide financial recommendations.
        </span>
      </div>
    </main>
  );
}
