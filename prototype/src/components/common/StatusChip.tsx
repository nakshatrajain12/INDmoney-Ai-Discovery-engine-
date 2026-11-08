import React from 'react';
import { CheckCircle2, AlertTriangle, PauseCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SipStatusType =
  | 'ACTIVE'
  | 'ACTIVE_ALERT'
  | 'MISSED_CONTINUES'
  | 'PAUSED'
  | 'RESTART_PENDING'
  | 'CANCELLED'
  | 'FAILED_EVENT';

interface StatusChipProps {
  status: SipStatusType | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, label, className, size = 'md' }: StatusChipProps) {
  const norm = status.toUpperCase();

  let bgClass = 'bg-ind-emerald-soft text-ind-emerald-text border-ind-emerald/20';
  let Icon = CheckCircle2;
  let text = label || 'Active';

  if (norm === 'ACTIVE_ALERT' || norm === 'MISSED_CONTINUES' || norm === 'ALERT') {
    bgClass = 'bg-ind-amber-soft text-ind-amber-text border-ind-amber/20';
    Icon = AlertTriangle;
    text = label || 'Active · 1 failed instalment';
  } else if (norm === 'PAUSED') {
    bgClass = 'bg-ind-blue-soft text-ind-blue-text border-ind-blue/20';
    Icon = PauseCircle;
    text = label || 'Paused';
  } else if (norm === 'RESTART_PENDING') {
    bgClass = 'bg-ind-amber-soft text-ind-amber-text border-ind-amber/20';
    Icon = Clock;
    text = label || 'Restart pending';
  } else if (norm === 'CANCELLED') {
    bgClass = 'bg-ind-coral-soft text-ind-coral-text border-ind-coral/20';
    Icon = XCircle;
    text = label || 'Cancelled';
  } else if (norm === 'FAILED_EVENT' || norm === 'FAILED') {
    bgClass = 'bg-ind-coral-soft text-ind-coral-text border-ind-coral/20';
    Icon = XCircle;
    text = label || 'Instalment failed';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        bgClass,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

