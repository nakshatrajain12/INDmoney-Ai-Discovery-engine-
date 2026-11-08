'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { formatRupees } from '@/lib/utils';

interface DebitPayConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
  amountPaise: number;
  schemeName: string;
  bankLabel?: string;
  eventId: string;
}

export function DebitPayConfirmSheet({
  isOpen,
  onClose,
  onConfirmSuccess,
  amountPaise,
  schemeName,
  bankLabel = 'Demo Bank ••4012',
  eventId
}: DebitPayConfirmSheetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call or call retry endpoint
      await fetch(`/api/v1/debit-events/${eventId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY_NOW' })
      });
      // Even if mock doesn't persist, we simulate demo success
      await new Promise(r => setTimeout(r, 900));
      setIsProcessing(false);
      setIsSuccess(true);
    } catch {
      setIsProcessing(false);
      setIsSuccess(true);
    }
  };

  const handleDone = () => {
    setIsSuccess(false);
    onConfirmSuccess();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={e => {
        if (!isProcessing && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-s1 p-6 shadow-ind-float animate-in fade-in slide-in-from-bottom-6 duration-200">
        {!isSuccess ? (
          <>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-ind-blue" aria-hidden="true" />
                <h2 id="pay-sheet-title" className="text-base font-bold text-t1 tracking-tight">
                  Pay Missed Instalment
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Close payment sheet"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-s2 text-t2 hover:bg-elev focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-s2 p-3 text-center">
                <span className="text-xs uppercase font-semibold text-t2">Amount to Pay</span>
                <div className="text-2xl font-bold tabular-nums text-t1 mt-0.5">
                  {formatRupees(amountPaise, false)}
                </div>
                <span className="text-[11px] text-t3">{schemeName}</span>
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-t2">Account / Mandate</span>
                  <span className="font-semibold text-t1">{bankLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-t2">SIP Status</span>
                  <span className="font-semibold text-ind-emerald-text">Active (continuous)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-t2">Type</span>
                  <span className="font-medium text-t1">Direct NetBanking / UPI simulation</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-ind-info-soft p-3 text-xs text-ind-info-text">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Demo prototype: No real bank debit or monetary transaction will occur.
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-s2 text-xs font-semibold text-t1 hover:bg-elev disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-ind-blue text-xs font-semibold text-white hover:bg-ind-blue-hover disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay Now (Demo)</span>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ind-emerald-soft text-ind-emerald-text">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>

            <h2 className="text-lg font-bold text-t1">Instalment Paid (Demo)</h2>
            <p className="text-xs text-t2 max-w-xs mx-auto">
              {formatRupees(amountPaise, false)} was successfully paid for {schemeName}. Your regular SIP schedule continues unaffected.
            </p>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleDone}
                className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ind-blue text-xs font-semibold text-white hover:bg-ind-blue-hover"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
