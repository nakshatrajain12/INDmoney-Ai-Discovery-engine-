'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Bell,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { OptionsComparisonMatrix, type ManageActionType } from '@/components/pause/OptionsComparisonMatrix';
import { formatRupees } from '@/lib/utils';
import type { OptionsComparisonPayload, PauseResponse } from '@/contracts/pause';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PausePage({ params }: PageProps) {
  const { id: sipId } = use(params);
  const { asOf, addInboxMessage } = useDemo();

  const [optionsPayload, setOptionsPayload] = useState<OptionsComparisonPayload | null>(null);
  const [selectedAction, setSelectedAction] = useState<ManageActionType | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number | 'open' | null>(null);
  const [optInReminder, setOptInReminder] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success & Undo state
  const [pauseSuccess, setPauseSuccess] = useState<PauseResponse | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(60);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoComplete, setUndoComplete] = useState(false);

  // Reduce amount state
  const [reducedAmount, setReducedAmount] = useState<string>('500');
  const [reduceSuccess, setReduceSuccess] = useState(false);

  // Cancel state
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/sips/${sipId}/options?asOf=${asOf}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setOptionsPayload(json.data);
        }
      } catch (err) {
        console.error('Failed to load pause options:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [sipId, asOf]);

  // Undo countdown timer
  useEffect(() => {
    if (!pauseSuccess || undoCountdown <= 0) return;
    const timer = setInterval(() => {
      setUndoCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [pauseSuccess, undoCountdown]);

  const handleConfirmPause = async () => {
    if (!isAcknowledged || !pauseDuration) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        optInReminder
      };

      if (typeof pauseDuration === 'number') {
        payload.durationMonths = pauseDuration;
      } else {
        payload.endDate = null;
      }

      const res = await fetch(`/api/v1/sips/${sipId}/pause?asOf=${asOf}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setPauseSuccess(json.data);
        addInboxMessage({
          kind: 'pause',
          title: `${optionsPayload?.schemeName || 'SIP'} paused`,
          body: `Your SIP was paused. No debits will occur during this period.`,
          date: asOf,
          sipId
        });
      }
    } catch (err) {
      console.error('Failed to pause SIP:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!pauseSuccess) return;
    setIsUndoing(true);
    try {
      await fetch(`/api/v1/pauses/${pauseSuccess.pause.id}/undo?asOf=${asOf}`, {
        method: 'POST'
      });
      setUndoComplete(true);
      setPauseSuccess(null);
    } catch (err) {
      console.error('Failed to undo pause:', err);
    } finally {
      setIsUndoing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-3 space-y-4">
        <AppHeader title="Manage SIP" showBack backHref={`/sip/${sipId}`} />
        <div className="rounded-2xl border border-border bg-s1 p-12 text-center text-xs text-t2 space-y-2">
          <div className="h-4 w-32 mx-auto rounded bg-s2 animate-pulse" />
          <div>Loading management choices...</div>
        </div>
      </main>
    );
  }

  // View: Pause Success Confirmation with 60s Undo Link
  if (pauseSuccess) {
    return (
      <main className="flex-1 px-4 py-3 space-y-4">
        <AppHeader title="Pause Confirmed" showBack backHref={`/sip/${sipId}`} />

        <div className="rounded-2xl border border-border bg-s1 p-6 text-center shadow-ind-card space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ind-blue-soft text-ind-blue">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>

          <div>
            <span className="rounded-full bg-ind-blue-soft px-3 py-1 text-xs font-bold text-ind-blue uppercase tracking-wide">
              SIP PAUSED
            </span>
            <h1 className="text-lg font-bold text-t1 tracking-tight mt-2">
              {optionsPayload?.schemeName} is paused
            </h1>
            <p className="text-xs text-t2 mt-1 max-w-xs mx-auto">
              Your next monthly debits are skipped as you chose. Existing units stay invested in your folio.
            </p>
          </div>

          {/* 60-second Undo Link */}
          {undoCountdown > 0 ? (
            <div className="rounded-xl border border-border bg-s2 p-3 text-xs">
              <span className="text-t2">Made a mistake? </span>
              <button
                type="button"
                onClick={handleUndo}
                disabled={isUndoing}
                className="font-bold text-ind-blue underline hover:opacity-80 disabled:opacity-50"
              >
                {isUndoing ? 'Undoing...' : `Undo pause (${undoCountdown}s left)`}
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-t3">
              Undo period expired. You can resume this SIP early anytime from the SIP dashboard.
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ind-blue text-xs font-semibold text-white hover:bg-ind-blue-hover"
            >
              Return to SIP Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // View: Undo complete
  if (undoComplete) {
    return (
      <main className="flex-1 px-4 py-3 space-y-4">
        <AppHeader title="Pause Undone" showBack backHref={`/sip/${sipId}`} />
        <div className="rounded-2xl border border-border bg-s1 p-6 text-center shadow-ind-card space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ind-emerald-soft text-ind-emerald-text">
            <RotateCcw className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-base font-bold text-t1">Pause was successfully undone</h1>
          <p className="text-xs text-t2">Your SIP remains active with its previous schedule.</p>
          <div className="pt-2">
            <Link
              href={`/sip/${sipId}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ind-blue px-4 text-xs font-semibold text-white hover:bg-ind-blue-hover"
            >
              Back to SIP Detail
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      <AppHeader
        title="Manage SIP"
        eyebrow="Pause or Change"
        showBack
        backHref={`/sip/${sipId}`}
      />

      {/* Header Info */}
      <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card">
        <h1 className="text-base font-bold text-t1 tracking-tight">
          {optionsPayload?.schemeName}
        </h1>
        <p className="text-xs text-t2 mt-0.5">
          Current instalment: {formatRupees(optionsPayload?.currentAmountPaise || 0, false)} / mo
        </p>
      </div>

      {/* Step 1: 3-Way Options Matrix */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-t2 mb-2">
          Select an option (none pre-selected)
        </h2>
        <OptionsComparisonMatrix
          selectedOption={selectedAction}
          onSelectOption={setSelectedAction}
          minInstallmentAmount={
            optionsPayload ? optionsPayload.minimumAmountPaise / 100 : 500
          }
        />
      </div>

      {/* Step 2: Pause Subflow */}
      {selectedAction === 'PAUSE' && (
        <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card space-y-4 animate-in fade-in duration-200">
          <div>
            <h2 className="text-sm font-bold text-t1 tracking-tight">Select Pause Duration</h2>
            <p className="text-xs text-t2 mt-0.5">
              Choose how long to pause. Nothing is chosen for you.
            </p>
          </div>

          {/* Duration Options */}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pause Duration">
            {[
              { val: 1, label: '1 Month', sub: 'Skip next instalment' },
              { val: 2, label: '2 Months', sub: 'Skip next 2 instalments' },
              { val: 3, label: '3 Months', sub: 'Skip next 3 instalments' },
              { val: 6, label: '6 Months', sub: 'Skip next 6 instalments' }
            ].map(d => (
              <button
                key={d.val}
                type="button"
                role="radio"
                aria-checked={pauseDuration === d.val}
                onClick={() => setPauseDuration(d.val)}
                className={`rounded-xl border p-3 text-left transition-all min-h-[44px] ${
                  pauseDuration === d.val
                    ? 'border-ind-blue bg-ind-blue-soft/30 ring-1 ring-ind-blue'
                    : 'border-border bg-s2 hover:bg-elev'
                }`}
              >
                <div className="text-xs font-bold text-t1">{d.label}</div>
                <div className="text-[10px] text-t3 mt-0.5">{d.sub}</div>
              </button>
            ))}
          </div>

          {/* Calm Reminder Opt-in Toggle */}
          <div className="rounded-xl border border-border bg-s2 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-ind-blue" aria-hidden="true" />
                <span className="text-xs font-semibold text-t1">
                  Calm Restart Reminder
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOptInReminder(!optInReminder)}
                aria-label="Toggle calm reminder"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  optInReminder ? 'bg-ind-blue' : 'bg-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    optInReminder ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-t3 leading-normal">
              Off by default. When enabled, receives a single, factual notification before the pause ends. Zero pressure or urgency.
            </p>
          </div>

          {/* Review of Facts */}
          {pauseDuration && (
            <div className="rounded-xl border border-border bg-s2 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-t1">What happens during the pause:</span>
              <ul className="space-y-1 text-t2 text-[11px]">
                <li>• No money will be debited from your bank during the skipped period.</li>
                <li>• All units already accumulated stay invested in your folio.</li>
                <li>• Your bank mandate remains active and ready for scheduled restart.</li>
              </ul>
            </div>
          )}

          {/* Explicit Acknowledgment Checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-border bg-s2 p-3 text-xs text-t2 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={e => setIsAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-ind-blue focus:ring-ind-blue"
            />
            <span>
              I understand no debits will be made for the skipped months, and my SIP will resume automatically on the scheduled date.
            </span>
          </label>

          {/* Submit Pause Button */}
          <button
            type="button"
            onClick={handleConfirmPause}
            disabled={!pauseDuration || !isAcknowledged || isSubmitting}
            className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ind-blue text-xs font-semibold text-white hover:bg-ind-blue-hover disabled:opacity-40"
          >
            {isSubmitting ? 'Scheduling Pause...' : 'Confirm Pause (Demo)'}
          </button>
        </div>
      )}

      {/* Step 2: Reduce Subflow */}
      {selectedAction === 'REDUCE' && (
        <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card space-y-4 animate-in fade-in duration-200">
          <div>
            <h2 className="text-sm font-bold text-t1 tracking-tight">Reduce Monthly Commitment</h2>
            <p className="text-xs text-t2 mt-0.5">
              Keep your regular habit while freeing up cash flow. Minimum is ₹500/mo.
            </p>
          </div>

          <div className="rounded-xl bg-s2 p-3 space-y-2">
            <label htmlFor="reduced-amount" className="text-xs font-semibold text-t2">
              New monthly instalment amount (₹)
            </label>
            <input
              id="reduced-amount"
              type="number"
              min="500"
              step="100"
              value={reducedAmount}
              onChange={e => setReducedAmount(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-border bg-s1 px-3 text-base font-bold tabular-nums text-t1"
            />
          </div>

          <button
            type="button"
            onClick={() => setReduceSuccess(true)}
            className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ind-blue text-xs font-semibold text-white hover:bg-ind-blue-hover"
          >
            Update Instalment to ₹{reducedAmount} (Demo)
          </button>

          {reduceSuccess && (
            <div className="rounded-xl bg-ind-emerald-soft p-3 text-xs text-ind-emerald-text font-semibold text-center">
              Instalment updated to ₹{reducedAmount}. The next debit will reflect this new amount.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Cancel Subflow */}
      {selectedAction === 'CANCEL' && (
        <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card space-y-4 animate-in fade-in duration-200">
          <div>
            <h2 className="text-sm font-bold text-t1 tracking-tight">Cancel SIP</h2>
            <p className="text-xs text-t2 mt-0.5">
              Cancelling permanently stops all future monthly debits for this scheme.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-s2 p-3.5 text-xs text-t2 space-y-1.5">
            <div className="font-semibold text-t1">Factual implications:</div>
            <div>• Future debits are stopped completely.</div>
            <div>• All past accumulated units remain safe in your folio.</div>
            <div>• No exit penalties are charged for stopping a SIP.</div>
          </div>

          {!cancelConfirmed ? (
            <button
              type="button"
              onClick={() => setCancelConfirmed(true)}
              className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ind-coral-text/40 bg-s2 text-xs font-semibold text-ind-coral-text hover:bg-elev"
            >
              Proceed to Cancel
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setCancelSuccess(true)}
                className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ind-coral-text text-xs font-semibold text-white hover:opacity-90"
              >
                Confirm Cancellation (Demo)
              </button>
              <button
                type="button"
                onClick={() => setCancelConfirmed(false)}
                className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-s2 text-xs font-semibold text-t2 hover:bg-elev"
              >
                Keep SIP Active
              </button>
            </div>
          )}

          {cancelSuccess && (
            <div className="rounded-xl bg-s2 p-3 text-xs text-t1 font-semibold text-center">
              SIP cancelled in demo simulation. Future debits stopped.
            </div>
          )}
        </div>
      )}

      {/* Persistent Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-s2 p-3 text-xs text-t3 leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-t2 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Options reflect verified mutual fund rules. Pausing or reducing has zero impact on units already accumulated in your folio.
        </span>
      </div>
    </main>
  );
}
