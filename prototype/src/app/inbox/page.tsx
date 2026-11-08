'use client';

import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { CalmReminderInboxCard } from '@/components/pause/CalmReminderInboxCard';
import { formatDate } from '@/lib/utils';

export default function InboxPage() {
  const { inbox, markMessageRead } = useDemo();

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      <AppHeader title="Messages" eyebrow="Inbox" showBack backHref="/" />

      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-t1 tracking-tight">Your Messages</h1>
        <span className="text-xs text-t2 font-medium">{inbox.length} notifications</span>
      </div>

      {inbox.length === 0 ? (
        <div className="rounded-2xl border border-border bg-s1 p-8 text-center text-xs text-t2 shadow-ind-card">
          No notifications in your inbox.
        </div>
      ) : (
        <div className="space-y-3">
          {inbox.map(msg => {
            if (msg.kind === 'reminder' && msg.sipId) {
              return (
                <CalmReminderInboxCard
                  key={msg.id}
                  sipId={msg.sipId}
                  schemeName={msg.title}
                  resumeDateFormatted={formatDate(msg.date)}
                  onActionComplete={() => markMessageRead(msg.id)}
                />
              );
            }

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border p-4 shadow-ind-card space-y-2 transition-all ${
                  msg.read ? 'border-border bg-s1' : 'border-ind-blue/30 bg-s1 ring-1 ring-ind-blue/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-s2 text-ind-blue">
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-t1">{msg.title}</h2>
                      <span className="text-[10px] text-t3">{formatDate(msg.date)}</span>
                    </div>
                  </div>

                  {!msg.read && (
                    <button
                      type="button"
                      onClick={() => markMessageRead(msg.id)}
                      className="inline-flex min-h-[44px] items-center text-[11px] font-semibold text-ind-blue hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <p className="text-xs text-t2 leading-relaxed">{msg.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-s2 p-3 text-xs text-t3 leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-t2 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Calm inbox guarantees no spam, no artificial urgency, and no unsolicited push notifications.
        </span>
      </div>
    </main>
  );
}
