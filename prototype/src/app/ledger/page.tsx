'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { formatRupees, formatDate } from '@/lib/utils';
import type { SipSummary } from '@/contracts/api';

interface LedgerRow {
  id: string;
  sipId: string;
  schemeName: string;
  date: string;
  amountPaise: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  nav?: number;
}

export default function LedgerPage() {
  const { personaKey, asOf, hideAmounts } = useDemo();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLedger() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/sips?persona=${personaKey}&asOf=${asOf}`);
        if (!res.ok) throw new Error('Failed to load SIPs');
        const json = await res.json();
        const summaries: SipSummary[] = json.data || [];

        const allRows: LedgerRow[] = [];

        await Promise.all(
          summaries.map(async s => {
            try {
              const dRes = await fetch(`/api/v1/sips/${s.id}?asOf=${asOf}`);
              if (!dRes.ok) return;
              const dJson = await dRes.json();
              const instalments = dJson.data?.instalments || [];

              instalments
                .filter((i: { status: string }) => i.status !== 'SKIPPED')
                .forEach(
                (i: {
                  id: string;
                  dueDate: string;
                  amountPaise: number;
                  status: string;
                  navE4?: number | null;
                }) => {
                  allRows.push({
                    id: i.id,
                    sipId: s.id,
                    schemeName: s.schemeName,
                    date: i.dueDate,
                    amountPaise: i.amountPaise,
                    status: i.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
                    nav: i.navE4 ? i.navE4 / 10000 : undefined
                  });
                }
              );
            } catch {
              /* ignore */
            }
          })
        );

        allRows.sort((a, b) => b.date.localeCompare(a.date));

        if (!cancelled) setRows(allRows);
      } catch (err) {
        console.error('Failed to load ledger:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLedger();

    return () => {
      cancelled = true;
    };
  }, [personaKey, asOf]);

  const filteredRows = rows.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      <AppHeader title="Ledger" eyebrow="Transactions" showBack backHref="/" />

      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-t1 tracking-tight">Instalment Ledger</h1>
        <div className="flex gap-1">
          {(['ALL', 'SUCCESS', 'FAILED'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors min-h-[44px] ${
                filter === f
                  ? 'border-ind-blue bg-ind-blue text-white'
                  : 'border-border bg-s1 text-t2 hover:bg-s2'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'SUCCESS' ? 'Successful' : 'Missed'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-s1 p-4 shadow-ind-card">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-t2">Loading transactions...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-t2">No instalments matching filter.</div>
        ) : (
          <div className="space-y-3">
            {filteredRows.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b border-border/40 last:border-b-0 text-xs"
              >
                <div>
                  <Link
                    href={`/sip/${r.sipId}`}
                    className="font-bold text-t1 hover:text-ind-blue truncate block max-w-[200px]"
                  >
                    {r.schemeName}
                  </Link>
                  <div className="text-[11px] text-t3 mt-0.5">
                    {formatDate(r.date)} {r.nav ? `· NAV ₹${r.nav.toFixed(2)}` : ''}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold tabular-nums text-t1">
                    {formatRupees(r.amountPaise, hideAmounts)}
                  </div>
                  <div
                    className={
                      r.status === 'SUCCESS'
                        ? 'text-[10px] font-semibold text-ind-emerald-text'
                        : 'text-[10px] font-semibold text-ind-coral-text'
                    }
                  >
                    {r.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
