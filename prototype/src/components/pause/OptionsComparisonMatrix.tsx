'use client';

import React from 'react';
import { PauseCircle, TrendingDown, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ManageActionType = 'PAUSE' | 'REDUCE' | 'CANCEL';

interface OptionsComparisonMatrixProps {
  selectedOption: ManageActionType | null;
  onSelectOption: (option: ManageActionType) => void;
  minInstallmentAmount?: number;
  className?: string;
}

export function OptionsComparisonMatrix({
  selectedOption,
  onSelectOption,
  minInstallmentAmount = 500,
  className
}: OptionsComparisonMatrixProps) {
  const options = [
    {
      id: 'PAUSE' as const,
      title: 'Pause SIP',
      subtitle: 'Skip upcoming debits temporarily',
      icon: PauseCircle,
      iconColor: 'text-ind-blue',
      facts: [
        'Skip 1 to 12 instalments or pause until you resume',
        'Existing units remain invested with daily NAV',
        'Automatically restarts on chosen date with zero penalty'
      ]
    },
    {
      id: 'REDUCE' as const,
      title: 'Reduce Amount',
      subtitle: 'Lower your monthly instalment',
      icon: TrendingDown,
      iconColor: 'text-ind-emerald-text',
      facts: [
        `Lower amount to as little as ₹${minInstallmentAmount}/mo`,
        'Maintains investment continuity with lower cash commitment',
        'Can be increased back anytime without re-registering folio'
      ]
    },
    {
      id: 'CANCEL' as const,
      title: 'Cancel SIP',
      subtitle: 'Stop all future debits permanently',
      icon: XCircle,
      iconColor: 'text-ind-coral-text',
      facts: [
        'Permanently terminates future monthly debits',
        'Existing units stay invested in your folio until redeemed',
        'Starting again later requires setting up a new SIP'
      ]
    }
  ];

  return (
    <div className={cn('space-y-3', className)} role="radiogroup" aria-label="SIP management choices">
      {options.map(opt => {
        const isSelected = selectedOption === opt.id;
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelectOption(opt.id)}
            className={cn(
              'w-full text-left rounded-2xl border p-4.5 transition-all shadow-ind-card',
              'focus-visible:outline-2 focus-visible:outline-focus min-h-[44px]',
              isSelected
                ? 'border-ind-blue bg-s1 ring-2 ring-ind-blue/20'
                : 'border-border bg-s1 hover:border-border/80'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-s2', opt.iconColor)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-t1 tracking-tight">{opt.title}</h2>
                  <p className="text-xs text-t2">{opt.subtitle}</p>
                </div>
              </div>

              {/* Accessible Radio indicator */}
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isSelected ? 'border-ind-blue bg-ind-blue text-white' : 'border-t3 bg-transparent'
                )}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </div>

            <ul className="mt-3.5 space-y-1.5 border-t border-border/50 pt-3 text-xs text-t2">
              {opt.facts.map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-t3 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

