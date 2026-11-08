'use client';

import React from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';

export interface TermDefinition {
  title: string;
  definition: string;
  source: string;
}

export const TERMS: Record<string, TermDefinition> = {
  XIRR: {
    title: 'XIRR (Extended Internal Rate of Return)',
    definition:
      'XIRR is an annualised, money-weighted return that accounts for the exact dates of your cash flows. In your first year, it annualises returns across a short horizon, which can make percentages appear amplified compared to absolute return.',
    source: 'AMFI Investor Education & SEBI Mutual Fund Guidelines (Demo placeholder)'
  },
  ABS: {
    title: 'Absolute Return',
    definition:
      'Absolute return simply measures the point-to-point percentage difference between your total invested amount and the current valuation, without annualising for time.',
    source: 'SEBI Mutual Fund Regulations (Demo placeholder)'
  },
  NAV: {
    title: 'Net Asset Value (NAV)',
    definition:
      'NAV represents the per-unit market value of the mutual fund scheme on a specific business day. When NAV is lower, your fixed monthly SIP instalment accumulates more units; when NAV rises, fewer units are purchased.',
    source: 'Association of Mutual Funds in India (AMFI) (Demo placeholder)'
  },
  VOL: {
    title: 'Market Volatility & Short Tenure',
    definition:
      'Short-term price fluctuations are typical in market-linked investments. During early months, capital is accumulated gradually, so early returns predominantly reflect entry-level market movements rather than long-term compounding.',
    source: 'Investor Awareness Study (Demo placeholder)'
  }
};

interface TermSheetProps {
  termKey: string | null;
  onClose: () => void;
}

export function TermSheet({ termKey, onClose }: TermSheetProps) {
  if (!termKey || !TERMS[termKey]) return null;

  const term = TERMS[termKey];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="term-sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-s1 p-6 shadow-ind-float animate-in fade-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-ind-blue" aria-hidden="true" />
            <h2 id="term-sheet-title" className="text-base font-bold text-t1 tracking-tight">
              {term.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close term definition"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-s2 text-t2 hover:bg-elev hover:text-t1 focus-visible:outline-2 focus-visible:outline-focus"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-t1 leading-relaxed">
            {term.definition}
          </p>

          <div className="mt-4 rounded-xl border border-border bg-s2 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-t2">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Verified Source Reference</span>
            </div>
            <p className="mt-1 text-xs text-t3">
              {term.source}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ind-blue px-4 text-sm font-semibold text-white hover:bg-ind-blue-hover focus-visible:outline-2 focus-visible:outline-focus"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
