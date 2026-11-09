'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { NetWorthHero } from '@/components/dashboard/NetWorthHero';
import { ReturnCoachBanner } from '@/components/dashboard/ReturnCoachBanner';
import { DebitAlertBanner } from '@/components/dashboard/DebitAlertBanner';
import { StatusChip } from '@/components/common/StatusChip';
import { formatRupees, formatSignedRupees, formatPercent, formatDate, formatShortDate } from '@/lib/utils';
import type { SipSummary } from '@/contracts/api';

interface SipWithMetrics {
  summary: SipSummary;
  investedPaise: number;
  currentValuePaise: number;
  absReturnPaise: number;
  absReturnBps: number | null;
  xirrBps: number | null;
  instalmentCount: number;
  tenureMonths: number;
  hasFailure: boolean;
  failureEventId?: string;
  failureReason?: string;
}

export default function Home() {
  const { personaKey, asOf, hideAmounts, inbox } = useDemo();
  const [sipsWithMetrics, setSipsWithMetrics] = useState<SipWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeNotice = inbox.find(m => !m.read && (m.kind === 'reminder' || m.kind === 'alert'));

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      setIsLoading(true);
      try {
        const cleanPersona = personaKey.replace(/_s\d+$/, '') || 'early-flat';
        const urlParams = new URLSearchParams();
        urlParams.set('persona', cleanPersona);
        if (asOf) urlParams.set('asOf', asOf);
        const res = await fetch(`/api/v1/sips?${urlParams.toString()}`);
        if (!res.ok) {
          console.warn('Could not load portfolio SIPs for persona:', cleanPersona);
          if (!cancelled) setSipsWithMetrics([]);
          return;
        }
        const json = await res.json();
        const summaries: SipSummary[] = json.data || [];

        // For each SIP, fetch its details and metrics
        const loaded: SipWithMetrics[] = await Promise.all(
          summaries.map(async s => {
            try {
              const [detailRes, metricsRes] = await Promise.all([
                fetch(`/api/v1/sips/${s.id}?asOf=${asOf}`),
                fetch(`/api/v1/sips/${s.id}/metrics?asOf=${asOf}`)
              ]);

              const detailJson = detailRes.ok ? await detailRes.json() : null;
              const metricsJson = metricsRes.ok ? await metricsRes.json() : null;

              const m = metricsJson?.data?.metrics;
              const failures = detailJson?.data?.failures || [];
              const activeFailure = failures.find((f: { resolved: boolean }) => !f.resolved);

              const invested = m?.investedPaise ?? s.instalmentAmountPaise;
              const currVal = m?.currentValuePaise ?? invested;
              const absPaise = m?.absoluteReturnPaise ?? (currVal - invested);

              return {
                summary: s,
                investedPaise: invested,
                currentValuePaise: currVal,
                absReturnPaise: absPaise,
                absReturnBps: m?.absoluteReturnPct ?? (invested > 0 ? ((currVal - invested) / invested) * 100 : 0),
                xirrBps: m?.xirrPct ?? null,
                instalmentCount: m?.instalmentsPaid ?? 1,
                tenureMonths: m?.tenureMonths ?? 0,
                hasFailure: s.status === 'PAYMENT_FAILED' || Boolean(activeFailure),
                failureEventId: activeFailure?.id || 'EV1',
                failureReason: activeFailure?.reasonCode
              };
            } catch {
              return {
                summary: s,
                investedPaise: s.instalmentAmountPaise,
                currentValuePaise: s.instalmentAmountPaise,
                absReturnPaise: 0,
                absReturnBps: 0,
                xirrBps: null,
                instalmentCount: 1,
                tenureMonths: 0,
                hasFailure: s.status === 'PAYMENT_FAILED'
              };
            }
          })
        );

        if (!cancelled) {
          setSipsWithMetrics(loaded);
        }
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [personaKey, asOf]);

  // Aggregate portfolio figures
  const totalInvested = sipsWithMetrics.reduce((acc, s) => acc + s.investedPaise, 0);
  const totalCurrentValue = sipsWithMetrics.reduce((acc, s) => acc + s.currentValuePaise, 0);
  const totalAbsReturn = totalCurrentValue - totalInvested;
  const portfolioAbsReturnBps =
    totalInvested > 0 ? (totalAbsReturn / totalInvested) * 100 : 0;

  // Average XIRR among valid SIPs
  const validXirrs = sipsWithMetrics.filter(s => s.xirrBps != null).map(s => s.xirrBps!);
  const portfolioXirrBps =
    validXirrs.length > 0 ? validXirrs.reduce((a, b) => a + b, 0) / validXirrs.length : null;

  // Active, Paused, and Attention SIPs
  const activeSips = sipsWithMetrics.filter(s => s.summary.status !== 'CANCELLED');
  const failedDebitSip = sipsWithMetrics.find(s => s.hasFailure);
  const negativeOrFlatSip = sipsWithMetrics.find(
    s => s.summary.status !== 'CANCELLED' && s.absReturnPaise <= 0 && s.instalmentCount >= 2
  );

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      {/* Frosted App Header */}
      <AppHeader title="SIP Dashboard" eyebrow="SIP Steady" />

      {/* Net Worth Hero Card */}
      <NetWorthHero
        totalInvestedPaise={totalInvested}
        currentValuePaise={totalCurrentValue}
        absReturnPaise={totalAbsReturn}
        absReturnBps={portfolioAbsReturnBps}
        xirrBps={portfolioXirrBps}
        sipCount={activeSips.length}
      />

      {/* Active In-App Reminder / Pre-Debit Banner */}
      {activeNotice && (
        <div className="rounded-2xl border border-ind-blue/30 bg-s1 p-4 shadow-ind-card space-y-2 border-l-4 border-l-ind-blue animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ind-blue-soft text-ind-blue text-xs">
                🔔
              </span>
              <h3 className="text-xs font-bold text-t1 truncate">{activeNotice.title}</h3>
            </div>
            <Link
              href="/inbox"
              className="text-[11px] font-semibold text-ind-blue hover:underline shrink-0"
            >
              Inbox →
            </Link>
          </div>
          <p className="text-xs text-t2 leading-relaxed">{activeNotice.body}</p>
        </div>
      )}

      {/* Top Debit Alert Banner (if any failure exists) */}
      {failedDebitSip && (
        <DebitAlertBanner
          sipId={failedDebitSip.summary.id}
          eventId={failedDebitSip.failureEventId || 'EV1'}
          schemeName={failedDebitSip.summary.schemeName}
          failureDateFormatted={formatDate(asOf)}
          amountFormatted={formatRupees(failedDebitSip.summary.instalmentAmountPaise, false)}
          reasonSummary={failedDebitSip.failureReason?.replace(/_/g, ' ').toLowerCase() || 'Payment missed'}
        />
      )}

      {/* Contextual Return Coach Entry Banner */}
      {negativeOrFlatSip && (
        <ReturnCoachBanner
          sipId={negativeOrFlatSip.summary.id}
          schemeName={negativeOrFlatSip.summary.schemeName}
          monthNo={negativeOrFlatSip.tenureMonths + 1}
          instalmentCount={negativeOrFlatSip.instalmentCount}
          absReturnFormatted={formatSignedRupees(negativeOrFlatSip.absReturnPaise, hideAmounts)}
          absPctFormatted={formatPercent(negativeOrFlatSip.absReturnBps)}
        />
      )}

      {/* Section: Your SIPs */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-t1 tracking-tight">Your SIPs</h2>
            <span className="rounded-full bg-s2 px-2 py-0.5 text-xs font-semibold text-t2 border border-border">
              {activeSips.length}
            </span>
          </div>

          <Link
            href="/coach"
            className="inline-flex min-h-[44px] items-center text-xs font-semibold text-ind-blue hover:underline"
          >
            Explain returns
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-s1 p-8 text-center text-xs text-t2 space-y-2">
            <div className="h-4 w-24 mx-auto rounded bg-s2 animate-pulse" />
            <div>Loading your portfolio...</div>
          </div>
        ) : activeSips.length === 0 ? (
          <div className="rounded-2xl border border-border bg-s1 p-6 text-center text-xs text-t2">
            No active SIPs found for this persona.
          </div>
        ) : (
          <div className="space-y-3">
            {activeSips.map(s => {
              const isPaused = s.summary.status === 'PAUSED';
              const isAlert = s.summary.status === 'PAYMENT_FAILED';

              return (
                <Link
                  key={s.summary.id}
                  href={`/sip/${s.summary.id}`}
                  className="block rounded-2xl border border-border bg-s1 p-4 shadow-ind-card transition-all hover:border-ind-blue/40 focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-t1 tracking-tight truncate">
                          {s.summary.schemeName}
                        </h3>
                      </div>
                      <p className="text-[11px] text-t3 mt-0.5 truncate">
                        {s.summary.category} · {formatRupees(s.summary.instalmentAmountPaise, false)} / mo
                      </p>
                    </div>

                    <StatusChip
                      status={
                        isAlert
                          ? 'ACTIVE_ALERT'
                          : isPaused
                          ? 'PAUSED'
                          : 'ACTIVE'
                      }
                      size="sm"
                    />
                  </div>

                  {/* Grid of 4 Key Figures */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
                    <div className="rounded-xl bg-s2 p-2.5">
                      <span className="text-[10px] font-semibold uppercase text-t3 tracking-wider">
                        Invested
                      </span>
                      <div className="mt-0.5 text-sm font-bold tabular-nums text-t1">
                        {formatRupees(s.investedPaise, hideAmounts)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-s2 p-2.5">
                      <span className="text-[10px] font-semibold uppercase text-t3 tracking-wider">
                        Current value
                      </span>
                      <div className="mt-0.5 text-sm font-bold tabular-nums text-t1">
                        {formatRupees(s.currentValuePaise, hideAmounts)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-s2 p-2.5">
                      <span className="text-[10px] font-semibold uppercase text-t3 tracking-wider">
                        Return
                      </span>
                      {/* CRITICAL: Zero coral styling on flat or negative returns. Text color is text-t1 */}
                      <div className="mt-0.5 text-sm font-bold tabular-nums text-t1">
                        {hideAmounts
                          ? '••••••'
                          : `${formatSignedRupees(s.absReturnPaise, false)} (${formatPercent(s.absReturnBps)})`}
                      </div>
                    </div>

                    <div className="rounded-xl bg-s2 p-2.5">
                      <span className="text-[10px] font-semibold uppercase text-t3 tracking-wider">
                        XIRR
                      </span>
                      <div className="mt-0.5 text-sm font-bold tabular-nums text-t1">
                        {s.xirrBps == null ? 'unavailable' : formatPercent(s.xirrBps)}
                      </div>
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="mt-3 flex items-center justify-between text-xs text-t2 pt-2 border-t border-border/40">
                    <span className="text-[11px] text-t3">
                      {s.instalmentCount} instalments paid
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-ind-blue">
                      <span>View details</span>
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity / Ledger Preview Card */}
      <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-t1 tracking-tight">Recent Instalments</h2>
          <Link
            href="/ledger"
            className="inline-flex min-h-[44px] items-center text-xs font-semibold text-ind-blue hover:underline"
          >
            View ledger
          </Link>
        </div>

        <div className="space-y-2 text-xs">
          {activeSips.slice(0, 3).map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-border/40 last:border-b-0"
            >
              <div>
                <div className="font-semibold text-t1 truncate max-w-[200px]">
                  {s.summary.schemeName}
                </div>
                <div className="text-[11px] text-t3">
                  Instalment date: {formatShortDate(asOf)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold tabular-nums text-t1">
                  {formatRupees(s.summary.instalmentAmountPaise, hideAmounts)}
                </div>
                <div className="text-[10px] font-semibold text-ind-emerald-text">
                  SUCCESSFUL
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Persistent Compliance Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-s2 p-3 text-xs text-t3 leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-t2 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          SIP Steady prototype is an educational reassurance and recovery engine. Demonstrates deterministic calculations and zero-digit generative rephrasing on mock data. Not investment advice.
        </span>
      </div>
    </main>
  );
}
