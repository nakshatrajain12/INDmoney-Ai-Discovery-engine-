'use client';

import React from 'react';
import { useDemo } from '@/context/DemoContext';
import { Bell, X } from 'lucide-react';
import Link from 'next/link';

export function GlobalToast() {
  const { activeToast, dismissToast } = useDemo();

  if (!activeToast) return null;

  return (
    <div
      role="status"
      className="fixed top-16 left-1/2 z-50 w-[92%] max-w-[396px] -translate-x-1/2 rounded-2xl border border-ind-blue/40 bg-s1 p-3.5 shadow-ind-float animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ind-blue-soft text-ind-blue">
            <Bell className="h-4 w-4 animate-bounce" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-t1 leading-snug">{activeToast}</div>
            <Link
              href="/inbox"
              onClick={dismissToast}
              className="mt-1 inline-flex min-h-[44px] items-center text-[11px] font-semibold text-ind-blue hover:underline"
            >
              View in Inbox →
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissToast}
          aria-label="Dismiss notification"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-1 text-t3 hover:bg-s2 hover:text-t1"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
