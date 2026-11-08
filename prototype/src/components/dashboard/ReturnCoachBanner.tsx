'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReturnCoachBannerProps {
  sipId: string;
  schemeName: string;
  monthNo: number;
  instalmentCount: number;
  absReturnFormatted: string;
  absPctFormatted: string;
  className?: string;
}

export function ReturnCoachBanner({
  sipId,
  schemeName,
  monthNo,
  instalmentCount,
  absReturnFormatted,
  absPctFormatted,
  className
}: ReturnCoachBannerProps) {
  const shortName = schemeName.split(' ')[0] || schemeName;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border border-l-4 border-l-ind-blue bg-s1 p-4 shadow-ind-card transition-all hover:border-ind-blue/50',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ind-blue-soft text-ind-blue">
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-t1 tracking-tight">
            What does my {shortName} return mean?
          </h2>
          <p className="mt-1 text-xs text-t2 leading-relaxed">
            Your {instalmentCount}-instalment SIP shows {absReturnFormatted} ({absPctFormatted}). See what the figures mean at month {monthNo}.
          </p>

          <div className="mt-3">
            <Link
              href={`/sip/${sipId}/coach`}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-ind-blue hover:underline focus-visible:outline-2 focus-visible:outline-focus"
            >
              <span>Understand my returns</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

