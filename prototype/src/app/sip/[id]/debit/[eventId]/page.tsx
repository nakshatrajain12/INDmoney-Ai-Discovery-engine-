'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, RefreshCw, Sliders, ShieldCheck } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { DebitPayConfirmSheet } from '@/components/debit/DebitPayConfirmSheet';
import { formatDate } from '@/lib/utils';
import type { DebitDiagnosis } from '@/contracts/debit';

interface PageProps {
  params: Promise<{ id: string; eventId: string }>;
}

export default function DebitExplainerPage({ params }: PageProps) {
  const { id: sipId, eventId } = use(params);
  const router = useRouter();
  const { asOf, addInboxMessage } = useDemo();

  const [diagnosis, setDiagnosis] = useState<DebitDiagnosis | null>(null);
  const [schemeName, setSchemeName] = useState<string>('Your SIP');
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDiagnosis() {
      setIsLoading(true);
      try {
        const [diagRes, sipRes] = await Promise.all([
          fetch(`/api/v1/debit-events/${eventId}/explain?asOf=${asOf}`),
          fetch(`/api/v1/sips/${sipId}?asOf=${asOf}`)
        ]);

        if (diagRes.ok) {
          const json = await diagRes.json();
          if (!cancelled) setDiagnosis(json.data);
        }

        if (sipRes.ok) {
          const sJson = await sipRes.json();
          if (!cancelled && sJson.data?.sip?.schemeName) {
            setSchemeName(sJson.data.sip.schemeName);
          }
        }
      } catch (err) {
        console.error('Failed to load debit diagnosis:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDiagnosis();

    return () => {
      cancelled = true;
    };
  }, [sipId, eventId, asOf]);

  const handlePaySuccess = () => {
    setIsPaySheetOpen(false);
    addInboxMessage({
      kind: 'payment',
      title: 'Instalment paid manually (demo)',
      body: `You manually paid ${diagnosis?.amountFormatted || 'the instalment'} for ${schemeName}. Your SIP schedule continues uninterrupted.`,
      date: asOf,
      sipId
    });
    router.push(`/sip/${sipId}`);
  };

  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-3 space-y-4">
        <AppHeader title="Debit Explainer" showBack backHref={`/sip/${sipId}`} />
        <div className="rounded-2xl border border-border bg-s1 p-12 text-center text-xs text-t2 space-y-2">
          <div className="h-4 w-32 mx-auto rounded bg-s2 animate-pulse" />
          <div>Diagnosing payment failure...</div>
        </div>
      </main>
    );
  }

  if (!diagnosis) {
    return (
      <main className="flex-1 px-4 py-3 space-y-4">
        <AppHeader title="Debit Explainer" showBack backHref={`/sip/${sipId}`} />
        <div className="rounded-2xl border border-border bg-s1 p-6 text-center text-xs text-t2">
          Could not locate the debit failure record.
        </div>
      </main>
    );
  }

  const isManualRetryAllowed = diagnosis.retry?.allowed;

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      <AppHeader
        title="Instalment Explainer"
        eyebrow="Payment Continuity"
        showBack
        backHref={`/sip/${sipId}`}
      />

      {/* Top Failure & Continuity Card */}
      <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ind-coral-text">
              Debit Diagnosis
            </div>
            <h1 className="text-base font-bold text-t1 tracking-tight mt-0.5">
              {schemeName}
            </h1>
            <p className="text-xs text-t2 mt-0.5">
              Instalment of {diagnosis.amountFormatted} on {formatDate(diagnosis.occurredOn)}
            </p>
          </div>

          <StatusChip status="ACTIVE_ALERT" label="Active · 1 missed" />
        </div>

        {/* Why It Failed Card */}
        <div className="rounded-xl border border-border/80 bg-s2 p-4">
          <div className="flex items-center gap-2 text-ind-amber-text text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Why this debit did not go through</span>
          </div>
          <p className="mt-2 text-sm text-t1 leading-relaxed font-medium">
            {diagnosis.humanReason}
          </p>
          {diagnosis.providerMessage && (
            <p className="mt-1 text-xs text-t3 font-mono">
              Provider response: &ldquo;{diagnosis.providerMessage}&rdquo;
            </p>
          )}
        </div>

        {/* Is My SIP Still Active? Reassurance Card */}
        <div className="rounded-xl border border-border bg-s2 p-4">
          <div className="flex items-center gap-2 text-ind-emerald-text text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Is my SIP still active?</span>
          </div>
          <p className="mt-2 text-sm text-t1 leading-relaxed">
            {diagnosis.sipStatusDetail}
          </p>
          {diagnosis.consequenceNotice && (
            <div className="mt-2 text-xs text-t2 border-t border-border/60 pt-2">
              {diagnosis.consequenceNotice}
            </div>
          )}
        </div>

        {/* Retry Information */}
        {diagnosis.retry?.nextRetryDate && (
          <div className="rounded-xl border border-border bg-ind-info-soft p-3 text-xs text-ind-info-text">
            <span className="font-semibold">Next automatic bank attempt:</span>{' '}
            {formatDate(diagnosis.retry.nextRetryDate)}. You can ensure adequate balance or pay manually below.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {isManualRetryAllowed ? (
          <button
            type="button"
            onClick={() => setIsPaySheetOpen(true)}
            className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-ind-blue px-4 text-xs font-semibold text-white hover:bg-ind-blue-hover shadow-ind-card focus-visible:outline-2 focus-visible:outline-focus"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Pay {diagnosis.amountFormatted} Now (Demo)</span>
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-s2 p-3 text-xs text-t2 text-center">
            Manual retry is not available for this debit type. The next debit will occur on schedule.
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push(`/sip/${sipId}/pause`)}
          className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-s1 px-4 text-xs font-semibold text-t1 hover:bg-s2 shadow-ind-card"
        >
          <Sliders className="h-4 w-4 text-ind-blue" aria-hidden="true" />
          <span>See Pause or Reduce Options</span>
        </button>
      </div>

      {/* Persistent Compliance Statement */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-s2 p-3 text-xs text-t3 leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-t2 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Missing one instalment does not incur penalties or cancel your folio. Rules reflect verified SEBI and bank autopay frameworks.
        </span>
      </div>

      {/* Pay Confirm Bottom Sheet */}
      <DebitPayConfirmSheet
        isOpen={isPaySheetOpen}
        onClose={() => setIsPaySheetOpen(false)}
        onConfirmSuccess={handlePaySuccess}
        amountPaise={diagnosis.amountPaise}
        schemeName={schemeName}
        eventId={eventId}
      />
    </main>
  );
}
