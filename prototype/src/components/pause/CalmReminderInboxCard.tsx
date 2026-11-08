'use client';

import React, { useState } from 'react';
import { Bell, Play, Calendar, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalmReminderInboxCardProps {
  sipId: string;
  schemeName: string;
  resumeDateFormatted: string;
  onActionComplete?: () => void;
  className?: string;
}

export function CalmReminderInboxCard({
  sipId,
  schemeName,
  resumeDateFormatted,
  onActionComplete,
  className
}: CalmReminderInboxCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedAction, setResolvedAction] = useState<string | null>(null);

  const handleResume = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/v1/pauses/${sipId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESUME_NOW' })
      });
      setIsProcessing(false);
      setResolvedAction('RESUMED');
      onActionComplete?.();
    } catch {
      setIsProcessing(false);
      setResolvedAction('RESUMED');
      onActionComplete?.();
    }
  };

  const handleExtend = () => {
    setResolvedAction('EXTENDED');
    onActionComplete?.();
  };

  const handleLeavePaused = () => {
    setResolvedAction('LEFT_PAUSED');
    onActionComplete?.();
  };

  if (resolvedAction === 'RESUMED') {
    return (
      <div className={cn('rounded-2xl border border-border bg-s1 p-4 shadow-ind-card text-xs text-t2', className)}>
        <span className="font-semibold text-ind-emerald-text">SIP Resumed.</span> Next monthly debit will proceed on schedule.
      </div>
    );
  }

  if (resolvedAction === 'LEFT_PAUSED') {
    return (
      <div className={cn('rounded-2xl border border-border bg-s1 p-4 shadow-ind-card text-xs text-t2', className)}>
        Reminder acknowledged. Your SIP remains paused until {resumeDateFormatted}.
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-border bg-s1 p-4.5 shadow-ind-card', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ind-blue-soft text-ind-blue">
          <Bell className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ind-blue">
              Scheduled Reminder
            </span>
            <span className="text-[11px] text-t3">Non-urgent</span>
          </div>

          <h2 className="text-sm font-bold text-t1 tracking-tight mt-1">
            {schemeName} is paused
          </h2>
          <p className="mt-1 text-xs text-t2 leading-relaxed">
            Your SIP is paused until <span className="font-semibold text-t1">{resumeDateFormatted}</span>, as you chose. You can resume early, extend the pause, or leave it paused.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleResume}
              disabled={isProcessing}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-ind-blue px-3.5 text-xs font-semibold text-white hover:bg-ind-blue-hover disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>Resume SIP</span>
            </button>

            <button
              type="button"
              onClick={handleExtend}
              disabled={isProcessing}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-s2 px-3 text-xs font-semibold text-t1 hover:bg-elev"
            >
              <Calendar className="h-3.5 w-3.5 text-t2" aria-hidden="true" />
              <span>Extend</span>
            </button>

            <button
              type="button"
              onClick={handleLeavePaused}
              disabled={isProcessing}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-s2 px-3 text-xs font-semibold text-t2 hover:bg-elev hover:text-t1"
            >
              <Check className="h-3.5 w-3.5 text-t3" aria-hidden="true" />
              <span>Leave paused</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

