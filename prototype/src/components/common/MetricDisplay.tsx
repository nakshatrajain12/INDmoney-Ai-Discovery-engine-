import React from 'react';
import { cn } from '@/lib/utils';

interface MetricDisplayProps {
  label: string;
  value: string;
  secondaryValue?: string;
  isNegative?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export function MetricDisplay({
  label,
  value,
  secondaryValue,
  isNegative = false,
  className,
  size = 'md'
}: MetricDisplayProps) {
  // CRITICAL INVARIANT: Zero coral styling on flat or negative returns.
  // Negative returns use neutral text (t1/t2), NEVER coral!
  const valueColor = isNegative ? 'text-t1' : 'text-t1';

  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-t2">{label}</span>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span
          className={cn(
            'font-bold tabular-nums tracking-tight',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-xl',
            size === 'hero' && 'text-2xl sm:text-3xl',
            valueColor
          )}
        >
          {value}
        </span>
        {secondaryValue && (
          <span className="text-xs font-medium tabular-nums text-t2">
            ({secondaryValue})
          </span>
        )}
      </div>
    </div>
  );
}

