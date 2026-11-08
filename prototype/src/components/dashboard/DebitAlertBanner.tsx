'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebitAlertBannerProps {
  sipId: string;
  eventId: string;
  schemeName: string;
  failureDateFormatted: string;
  amountFormatted: string;
  reasonSummary?: string;
  className?: string;
}

export function DebitAlertBanner({
  sipId,
  eventId,
  schemeName,
  failureDateFormatted,
  amountFormatted,
  reasonSummary = 'Payment failed',
  className
}: DebitAlertBannerProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border border-l-4 border-l-ind-amber bg-s1 p-4 shadow-ind-card',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ind-amber-soft text-ind-amber-text">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-t1 tracking-tight">An instalment failed</h2>
            <span className="rounded-full bg-ind-emerald-soft px-2 py-0.5 text-[10px] font-semibold text-ind-emerald-text">
              SIP Active
            </span>
          </div>

          <p className="mt-1 text-xs text-t2">
            {schemeName} · {failureDateFormatted} · {amountFormatted}
          </p>
          <p className="mt-0.5 text-[11px] text-t3">
            {reasonSummary}. Your SIP continues as scheduled.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/sip/${sipId}/debit/${eventId}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-s2 px-3.5 text-xs font-semibold text-t1 hover:bg-elev focus-visible:outline-2 focus-visible:outline-focus"
            >
              <span>See why & next step</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

