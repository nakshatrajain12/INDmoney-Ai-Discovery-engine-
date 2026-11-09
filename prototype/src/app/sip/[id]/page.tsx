'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Sliders, HelpCircle } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { NetWorthHero } from '@/components/dashboard/NetWorthHero';
import { AccumulationSparkline, type SparklinePoint } from '@/components/dashboard/AccumulationSparkline';
import { ReturnCoachBanner } from '@/components/dashboard/ReturnCoachBanner';
import { DebitAlertBanner } from '@/components/dashboard/DebitAlertBanner';
import { StatusChip } from '@/components/common/StatusChip';
import { formatRupees, formatSignedRupees, formatPercent, formatDate, formatShortDate } from '@/lib/utils';
import type { SipDetail } from '@/contracts/api';
import type { FinancialMetrics } from '@/contracts/domain';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SipDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { asOf, hideAmounts } = useDemo();

  const [sipData, setSipData] = useState<SipDetail | null>(null);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      try {
        const [detailRes, metricsRes] = await Promise.all([
          fetch(`/api/v1/sips/${id}?asOf=${asOf}`),
          fetch(`/api/v1/sips/${id}/metrics?asOf=${asOf}`)
        ]);

        if (detailRes.ok) {
          const json = await detailRes.json();
          if (!cancelled) setSipData(json.data);
        }

        if (metricsRes.ok) {
          const json = await metricsRes.json();
          if (!cancelled) setMetrics(json.data?.metrics);
        }
      } catch (err) {
        console.error('Failed to load SIP detail:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id, asOf]);

  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-3 space-y-4">
        <AppHeader title="SIP Detail" showBack backHref="/" />
        <div className="rounded-2xl border border-border bg-s1 p-12 text-center text-xs text-t2 space-y-2">
          <div className="h-4 w-32 mx-auto rounded bg-s2 animate-pulse" />
          <div>Loading SIP figures...</div>
        </div>
      </main>
    );
  }

  if (!sipData) {
    return (
      <main className="flex-1 px-4 py-3 space-y-4">
        <AppHeader title="SIP Not Found" showBack backHref="/" />
        <div className="rounded-2xl border border-border bg-s1 p-6 text-center text-xs text-t2">
          We could not locate this SIP record in the demo data.
        </div>
      </main>
    );
  }

  const s = sipData.sip;
  const valuation = sipData.valuation;
  const instalments = sipData.instalments || [];
  const failures = sipData.failures || [];
  const activeFailure = failures.find(f => !f.resolved);

  const totalInvestedPaise = metrics?.investedPaise ?? s.declared.totalInvestedPaise;
  const currentValuePaise = metrics?.currentValuePaise ?? valuation?.currentValuePaise ?? totalInvestedPaise;
  const absReturnPaise = metrics?.absoluteReturnPaise ?? (currentValuePaise - totalInvestedPaise);
  const absReturnBps = metrics?.absoluteReturnPct ?? null;
  const xirrBps = metrics?.xirrPct ?? null;
  const tenureMonths = metrics?.tenureMonths ?? 0;
  const instalmentCount = metrics?.instalmentsPaid ?? instalments.length;

  // Day of month from investment date anchor (e.g. "2026-06-15" -> 15)
  const dayOfMonth = s.investmentDate ? Number(s.investmentDate.split('-')[2]) : 1;

  // Build sparkline data points
  const sparklinePoints: SparklinePoint[] = instalments
    .filter(i => i.status === 'SUCCESS' && i.navE4)
    .map(i => ({
      label: formatShortDate(i.dueDate).split(' ')[1] || 'Mo',
      nav: i.navE4 ? i.navE4 / 10000 : 0
    }));

  if (valuation && valuation.currentNavE4) {
    sparklinePoints.push({
      label: 'Now',
      nav: valuation.currentNavE4 / 10000
    });
  }

  const currentNav = valuation?.currentNavE4 ? valuation.currentNavE4 / 10000 : 0;
  const totalUnits = currentNav > 0 ? (currentValuePaise / 100) / currentNav : 0;
  const avgNav = totalUnits > 0 ? (totalInvestedPaise / 100) / totalUnits : currentNav;

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      <AppHeader title={s.schemeName} eyebrow="SIP Detail" showBack backHref="/" />

      {/* Top Scheme Overview Bar */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-t1 tracking-tight">{s.schemeName}</h1>
          <p className="text-xs text-t2 mt-0.5">
            Folio {s.folioMasked} · {s.category} · {formatRupees(s.instalmentAmountPaise, false)} on the {dayOfMonth}th
          </p>
        </div>

        <StatusChip
          status={
            activeFailure
              ? 'ACTIVE_ALERT'
              : sipData.status === 'PAUSED'
              ? 'PAUSED'
              : sipData.status === 'CANCELLED'
              ? 'CANCELLED'
              : 'ACTIVE'
          }
        />
      </div>

      {/* NetWorthHero for this SIP */}
      <NetWorthHero
        totalInvestedPaise={totalInvestedPaise}
        currentValuePaise={currentValuePaise}
        absReturnPaise={absReturnPaise}
        absReturnBps={absReturnBps}
        xirrBps={xirrBps}
        title="Scheme Valuation (demo)"
      />

      {/* Failed Debit Alert Banner (if failure exists) */}
      {activeFailure && (
        <DebitAlertBanner
          sipId={s.id}
          eventId={activeFailure.id}
          schemeName={s.schemeName}
          failureDateFormatted={formatDate(activeFailure.occurredOn)}
          amountFormatted={formatRupees(activeFailure.amountPaise, false)}
          reasonSummary={(activeFailure.reasonCode || 'PAYMENT_FAILED').replace(/_/g, ' ').toLowerCase()}
        />
      )}

      {/* Return Coach Trigger Banner */}
      <ReturnCoachBanner
        sipId={s.id}
        schemeName={s.schemeName}
        monthNo={tenureMonths + 1}
        instalmentCount={instalmentCount}
        absReturnFormatted={formatSignedRupees(absReturnPaise, hideAmounts)}
        absPctFormatted={formatPercent(absReturnBps)}
      />

      {/* Accumulation Sparkline Card */}
      {sparklinePoints.length >= 2 && (
        <AccumulationSparkline
          points={sparklinePoints}
          avgNav={avgNav}
          currentNav={currentNav}
          totalUnits={totalUnits}
        />
      )}

      {/* Primary Action Buttons */}
      <div className="flex gap-2">
        <Link
          href={`/sip/${s.id}/pause`}
          className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-s1 text-xs font-semibold text-t1 hover:bg-s2 shadow-ind-card"
        >
          <Sliders className="h-4 w-4 text-ind-blue" aria-hidden="true" />
          <span>Manage SIP / Pause</span>
        </Link>

        <Link
          href={`/sip/${s.id}/coach`}
          className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-ind-blue text-xs font-semibold text-white hover:bg-ind-blue-hover shadow-ind-card"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          <span>Explain My Returns</span>
        </Link>
      </div>

      {/* Plan Details Card */}
      <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card space-y-3">
        <h2 className="text-sm font-bold text-t1 tracking-tight">Plan Details</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-s2 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-t3">Bank Mandate</span>
            <div className="font-bold text-t1 mt-0.5">{s.mandate.bankLabel}</div>
            <div className="text-[10px] text-t3">{s.mandate.type}</div>
          </div>
          <div className="rounded-xl bg-s2 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-t3">Frequency</span>
            <div className="font-bold text-t1 mt-0.5">Monthly</div>
            <div className="text-[10px] text-t3">{dayOfMonth}th of each month</div>
          </div>
          <div className="rounded-xl bg-s2 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-t3">Folio</span>
            <div className="font-bold text-t1 mt-0.5">{s.folioMasked}</div>
            <div className="text-[10px] text-t3">Direct Growth</div>
          </div>
          <div className="rounded-xl bg-s2 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-t3">Started On</span>
            <div className="font-bold text-t1 mt-0.5">{formatDate(s.investmentDate)}</div>
            <div className="text-[10px] text-t3">{instalmentCount} instalments so far</div>
          </div>
        </div>
      </div>

      {/* Instalment Ledger Table */}
      {(() => {
        const visibleInstalments = instalments.filter(i => i.status !== 'SKIPPED');
        return (
          <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-t1 tracking-tight">Instalment History</h2>
              <span className="text-xs text-t2 font-medium">{visibleInstalments.length} records</span>
            </div>

            <div className="space-y-2 text-xs">
              {visibleInstalments.map(i => {
                const isSuccess = i.status === 'SUCCESS';
                const navRupees = i.navE4 ? (i.navE4 / 10000).toFixed(2) : null;

                return (
                  <div
                    key={i.id}
                    className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-b-0"
                  >
                    <div>
                      <div className="font-bold text-t1">{formatDate(i.dueDate)}</div>
                      <div className="text-[11px] text-t3">
                        {navRupees ? `NAV: ₹${navRupees}` : 'Pending allocation'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold tabular-nums text-t1">
                        {formatRupees(i.amountPaise, hideAmounts)}
                      </div>
                      <div
                        className={
                          isSuccess
                            ? 'text-[10px] font-semibold text-ind-emerald-text'
                            : 'text-[10px] font-semibold text-ind-coral-text'
                        }
                      >
                        {isSuccess ? 'SUCCESS' : 'FAILED'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </main>
  );
}
