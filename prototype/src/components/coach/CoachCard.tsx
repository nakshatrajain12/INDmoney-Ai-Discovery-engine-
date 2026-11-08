'use client';

import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, AlertCircle, Check, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { TermSheet } from './TermSheet';
import { useDemo } from '@/context/DemoContext';
import type { CoachResponse } from '@/contracts/coach';
import { cn } from '@/lib/utils';

interface CoachCardProps {
  data: CoachResponse;
  schemeName?: string;
  onAskQuestion?: (question: string) => void;
  className?: string;
}

export function CoachCard({ data, schemeName = 'Your SIP', onAskQuestion, className }: CoachCardProps) {
  const { hideAmounts } = useDemo();
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [feedbackClear, setFeedbackClear] = useState<boolean | null>(null);
  const [feedbackAdvice, setFeedbackAdvice] = useState<boolean | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearFeedback = (val: boolean) => {
    setFeedbackClear(val);
    showToast('Thanks for your feedback! Stored for session quality.');
  };

  const handleAdviceFeedback = (val: boolean) => {
    setFeedbackAdvice(val);
    showToast('Thanks for keeping our advice-free boundary strict!');
  };

  const handleQuickQuestion = (q: string) => {
    if (onAskQuestion) {
      onAskQuestion(q);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    if (onAskQuestion) {
      onAskQuestion(customQuestion.trim());
      setCustomQuestion('');
    }
  };

  // If refusal or insufficient data
  if (data.isRefusal && data.refusal) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Persistent Disclaimer */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-s2 px-3 py-2 text-xs text-t2">
          <ShieldCheck className="h-4 w-4 text-ind-blue shrink-0" aria-hidden="true" />
          <span>{data.disclaimer}</span>
        </div>

        <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card">
          <div className="flex items-center gap-2 text-ind-amber-text">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-base font-bold tracking-tight text-t1">
              Factual Boundary Notice
            </h2>
          </div>
          <p className="mt-2 text-sm text-t1 leading-relaxed">
            {data.refusal.message || data.refusal.reason}
          </p>
          {data.refusal.educationalLinks && data.refusal.educationalLinks.length > 0 && (
            <div className="mt-3 border-t border-border pt-2 text-xs text-t2">
              <span className="font-semibold text-t1">Educational references:</span>
              <ul className="mt-1 space-y-1">
                {data.refusal.educationalLinks.map((link, idx) => (
                  <li key={idx} className="text-ind-blue">
                    • {link.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const blocks = data.blocks;
  if (!blocks) {
    return (
      <div className={cn('rounded-2xl border border-border bg-s1 p-6 text-center text-t2', className)}>
        No return explanation data available for this SIP.
      </div>
    );
  }

  const { figures, means, doesNotMean } = blocks;
  const confLabel = data.confidence.label;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-elev px-4 py-2 text-xs font-semibold text-t1 shadow-ind-float animate-in fade-in"
        >
          {toastMessage}
        </div>
      )}

      {/* Persistent Disclaimer Banner */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-s2 px-3.5 py-2.5 text-xs text-t2">
        <ShieldCheck className="h-4 w-4 text-ind-blue shrink-0" aria-hidden="true" />
        <span className="font-medium">{data.disclaimer}</span>
      </div>

      {/* "In Short" Summary Card */}
      <div className="rounded-2xl border border-border border-l-4 border-l-ind-emerald bg-s1 p-4 shadow-ind-card">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ind-emerald-text">
          In Short
        </span>
        <p className="mt-1 text-sm font-medium text-t1 leading-relaxed">
          {figures.summaryText}
        </p>
      </div>

      {/* Block 1: Your Figures */}
      <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ind-blue">
              Block 1
            </span>
            <h2 className="text-base font-bold text-t1 tracking-tight mt-0.5">
              Your Figures
            </h2>
          </div>
          <span className="text-xs text-t2 font-medium">
            {schemeName} · Month {figures.tenureMonths + 1} · {figures.instalmentsPaid} instalments
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-s2 p-3">
            <span className="text-[11px] font-semibold uppercase text-t2">Invested</span>
            <div className="mt-0.5 text-base font-bold tabular-nums text-t1">
              {hideAmounts ? '••••••' : figures.investedFormatted}
            </div>
          </div>

          <div className="rounded-xl bg-s2 p-3">
            <span className="text-[11px] font-semibold uppercase text-t2">Current Value</span>
            <div className="mt-0.5 text-base font-bold tabular-nums text-t1">
              {hideAmounts ? '••••••' : figures.currentValueFormatted || '—'}
            </div>
          </div>

          <div className="rounded-xl bg-s2 p-3">
            <span className="text-[11px] font-semibold uppercase text-t2">Return</span>
            {/* Zero coral styling on flat or negative returns! Text is text-t1 */}
            <div className="mt-0.5 text-base font-bold tabular-nums text-t1">
              {hideAmounts
                ? '••••••'
                : `${figures.absoluteReturnFormatted || '—'} (${figures.absoluteReturnPctFormatted || '—'})`}
            </div>
          </div>

          <div className="rounded-xl bg-s2 p-3">
            <span className="text-[11px] font-semibold uppercase text-t2">XIRR (annualised)</span>
            <div className="mt-0.5 text-base font-bold tabular-nums text-t1">
              {figures.xirrFormatted || 'unavailable'}
            </div>
          </div>
        </div>

        {/* Interactive Term Definition Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTerm('XIRR')}
            aria-label="Explain XIRR term"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-s2 px-3.5 py-1.5 text-xs font-semibold text-t1 hover:bg-elev focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span>XIRR ({figures.xirrFormatted || 'n/a'})</span>
            <HelpCircle className="h-3.5 w-3.5 text-ind-blue" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTerm('ABS')}
            aria-label="Explain absolute return term"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-s2 px-3.5 py-1.5 text-xs font-semibold text-t1 hover:bg-elev focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span>Absolute return ({figures.absoluteReturnPctFormatted || 'n/a'})</span>
            <HelpCircle className="h-3.5 w-3.5 text-ind-blue" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTerm('NAV')}
            aria-label="Explain NAV term"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-s2 px-3.5 py-1.5 text-xs font-semibold text-t1 hover:bg-elev focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span>NAV pricing</span>
            <HelpCircle className="h-3.5 w-3.5 text-ind-blue" aria-hidden="true" />
          </button>
        </div>

        {figures.tenureMonths < 12 && (
          <p className="mt-3 text-[11px] text-t3 leading-normal">
            XIRR annualises short-horizon returns, which may look amplified during your first year. Tap XIRR above to read the verified definition.
          </p>
        )}
      </div>

      {/* Block 2: What This Means */}
      <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ind-emerald-text">
          Block 2
        </span>
        <h2 className="text-base font-bold text-t1 tracking-tight mt-0.5">
          {means.title}
        </h2>
        <p className="mt-2 text-sm text-t1 leading-relaxed">
          {means.body}
        </p>
        {means.keyTakeaway && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-s2 p-3 text-xs text-t2">
            <Check className="h-4 w-4 text-ind-emerald-text shrink-0 mt-0.5" aria-hidden="true" />
            <span>{means.keyTakeaway}</span>
          </div>
        )}
      </div>

      {/* Block 3: What It Does Not Mean */}
      <div className="rounded-2xl border border-border bg-s1 p-5 shadow-ind-card">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ind-blue">
          Block 3
        </span>
        <h2 className="text-base font-bold text-t1 tracking-tight mt-0.5">
          {doesNotMean.title}
        </h2>
        <p className="mt-2 text-sm text-t1 leading-relaxed">
          {doesNotMean.body}
        </p>
        {doesNotMean.keyTakeaway && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-s2 p-3 text-xs text-t2">
            <ShieldCheck className="h-4 w-4 text-ind-blue shrink-0 mt-0.5" aria-hidden="true" />
            <span>{doesNotMean.keyTakeaway}</span>
          </div>
        )}
      </div>

      {/* Verified Sources & Confidence Strip */}
      <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-t1">Confidence</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                confLabel === 'HIGH' && 'bg-ind-emerald-soft text-ind-emerald-text',
                confLabel === 'MEDIUM' && 'bg-ind-amber-soft text-ind-amber-text',
                confLabel === 'LOW' && 'bg-s2 text-t2'
              )}
            >
              {confLabel}
            </span>
          </div>

          {data.audit?.rephraseStatus && (
            <span className="text-[10px] text-t3 uppercase font-medium">
              Source: {data.audit.rephraseStatus}
            </span>
          )}
        </div>

        {data.confidence.reasons && data.confidence.reasons.length > 0 && (
          <p className="mt-2 text-xs text-t2">
            {data.confidence.reasons.join(' ')}
          </p>
        )}

        {data.sources.length > 0 && (
          <div className="mt-3 border-t border-border/50 pt-2.5">
            <span className="text-[10px] font-semibold uppercase text-t3 tracking-wider">
              Educational reference
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {data.sources.map(src => (
                <span
                  key={src.id}
                  className="rounded-lg bg-s2 px-2.5 py-1 text-[11px] text-t2 border border-border"
                >
                  {src.title} · {src.publisher}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Feedback Controls: Was this clear? / Did this feel like advice? */}
      <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-t1">Was this explanation clear?</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleClearFeedback(true)}
              aria-label="Yes, explanation was clear"
              className={cn(
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold',
                feedbackClear === true ? 'bg-ind-emerald-soft text-ind-emerald-text border-ind-emerald/30' : 'bg-s2 text-t2 hover:bg-elev'
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleClearFeedback(false)}
              aria-label="No, explanation was not clear"
              className={cn(
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold',
                feedbackClear === false ? 'bg-s2 text-t1 border-t3' : 'bg-s2 text-t2 hover:bg-elev'
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              No
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs border-t border-border/50 pt-3">
          <span className="font-semibold text-t1">Did this feel like financial advice?</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAdviceFeedback(false)}
              aria-label="No, felt factual and non-advice"
              className={cn(
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold',
                feedbackAdvice === false ? 'bg-ind-blue-soft text-ind-blue border-ind-blue/30' : 'bg-s2 text-t2 hover:bg-elev'
              )}
            >
              No, factual
            </button>
            <button
              type="button"
              onClick={() => handleAdviceFeedback(true)}
              aria-label="Yes, felt like advice"
              className={cn(
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold',
                feedbackAdvice === true ? 'bg-ind-amber-soft text-ind-amber-text border-ind-amber/30' : 'bg-s2 text-t2 hover:bg-elev'
              )}
            >
              Felt like advice
            </button>
          </div>
        </div>
      </div>

      {/* Follow-up Questions & Intent Guard Interactivity */}
      <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-ind-blue" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-t1">
            Ask a Follow-Up Question
          </h2>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickQuestion('Why is XIRR different from absolute return?')}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-s2 px-3 text-xs text-t1 hover:bg-elev text-left focus-visible:outline-2 focus-visible:outline-focus"
          >
            Why is XIRR different from absolute return?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion('Is negative return normal in month 5?')}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-s2 px-3 text-xs text-t1 hover:bg-elev text-left focus-visible:outline-2 focus-visible:outline-focus"
          >
            Is negative return normal in month 5?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion('Should I stop or sell my SIP?')}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-s2 px-3 text-xs text-t1 hover:bg-elev text-left focus-visible:outline-2 focus-visible:outline-focus"
          >
            Should I stop or sell my SIP?
          </button>
        </div>

        {onAskQuestion && (
          <form onSubmit={handleCustomSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              placeholder="Ask anything about your figures..."
              className="flex-1 min-h-[44px] rounded-xl border border-border bg-s2 px-3 text-xs text-t1 placeholder:text-t3 focus:border-focus focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customQuestion.trim()}
              className="inline-flex min-h-[44px] min-w-[64px] items-center justify-center rounded-xl bg-ind-blue px-3 text-xs font-semibold text-white hover:bg-ind-blue-hover disabled:opacity-40"
            >
              Ask
            </button>
          </form>
        )}
      </div>

      {/* Active Term Definition Bottom Sheet */}
      <TermSheet termKey={activeTerm} onClose={() => setActiveTerm(null)} />
    </div>
  );
}
