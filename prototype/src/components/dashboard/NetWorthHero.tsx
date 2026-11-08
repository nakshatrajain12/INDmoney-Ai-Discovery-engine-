'use client';

import React from 'react';
import { useDemo } from '@/context/DemoContext';
import { formatRupees, formatSignedRupees, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface NetWorthHeroProps {
  totalInvestedPaise: number;
  currentValuePaise: number;
  absReturnPaise: number;
  absReturnBps: number | null;
  xirrBps: number | null;
  sipCount?: number;
  title?: string;
  className?: string;
}

export function NetWorthHero({
  totalInvestedPaise,
  currentValuePaise,
  absReturnPaise,
  absReturnBps,
  xirrBps,
  sipCount,
  title = 'Your SIP portfolio (demo)',
  className
}: NetWorthHeroProps) {
  const { hideAmounts } = useDemo();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#262F40] p-4 text-white shadow-ind-card',
        'bg-gradient-to-br from-[#0F172A] to-[#1E293B]',
        className
      )}
    >
      {/* Top row: Label and SIP count */}
      <div className="flex items-center justify-between text-xs text-[#94A3B8]">
        <span className="font-medium tracking-wide">{title}</span>
        {sipCount != null && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-[#CBD5E1]">
            {sipCount} {sipCount === 1 ? 'SIP' : 'SIPs'}
          </span>
        )}
      </div>

      {/* Main Figures: Total Invested vs Current Value */}
      <div className="mt-3.5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
            Total invested
          </div>
          <div className="mt-0.5 text-xl sm:text-2xl font-bold tabular-nums text-white">
            {formatRupees(totalInvestedPaise, hideAmounts)}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
            Current value
          </div>
          <div className="mt-0.5 text-xl sm:text-2xl font-bold tabular-nums text-white">
            {formatRupees(currentValuePaise, hideAmounts)}
          </div>
        </div>
      </div>

      {/* Bottom Strip: Return & XIRR */}
      {/* CRITICAL: Zero coral styling on flat or negative returns. The color is #F8FAFC neutral. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[#94A3B8]">Return</span>
          <span className="font-bold tabular-nums text-[#F8FAFC]">
            {hideAmounts ? '••••••' : `${formatSignedRupees(absReturnPaise, false)} (${formatPercent(absReturnBps)})`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[#94A3B8]">XIRR (annualised)</span>
          <span className="font-bold tabular-nums text-[#F8FAFC]">
            {xirrBps == null ? 'unavailable' : formatPercent(xirrBps)}
          </span>
        </div>
      </div>
    </div>
  );
}

