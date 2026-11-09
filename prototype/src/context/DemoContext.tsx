'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { addDays, diffDays, toMs, fromMs } from '@/lib/dates';
import { formatDate } from '@/lib/utils';
import type { PersonaSummary, SipSummary } from '@/contracts/api';

export interface InboxMessage {
  id: string;
  kind: 'reminder' | 'payment' | 'pause' | 'alert' | 'info';
  title: string;
  body: string;
  date: string;
  sipId?: string;
  read: boolean;
}

interface DemoContextValue {
  personaKey: string;
  setPersonaKey: (key: string) => void;
  personas: PersonaSummary[];
  asOf: string;
  setAsOf: (date: string) => void;
  advanceDays: (days: number) => void;
  hideAmounts: boolean;
  toggleHideAmounts: () => void;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  llmEnabled: boolean;
  toggleLlm: () => void;
  inbox: InboxMessage[];
  addInboxMessage: (msg: Omit<InboxMessage, 'id' | 'read'>) => void;
  markMessageRead: (id: string) => void;
  resetToDefaults: () => void;
  isLoadingPersonas: boolean;
  activeToast: string | null;
  dismissToast: () => void;
}

const DEFAULT_PERSONA = 'early-flat';
const DEFAULT_AS_OF = '2026-11-08';

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

function getInitialValue<T>(key: string, fallback: T, parser?: (val: string) => T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    if (key === 'sip_steady_persona') {
      const sanitized = item.replace(/_s\d+$/, '');
      return (sanitized || fallback) as unknown as T;
    }
    return parser ? parser(item) : (item as unknown as T);
  } catch {
    return fallback;
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [personaKey, setPersonaKeyState] = useState<string>(() =>
    getInitialValue('sip_steady_persona', DEFAULT_PERSONA)
  );
  const [asOf, setAsOfState] = useState<string>(() =>
    getInitialValue('sip_steady_date', DEFAULT_AS_OF)
  );
  const [hideAmounts, setHideAmounts] = useState<boolean>(() =>
    getInitialValue('sip_steady_hide_amounts', false, v => v === 'true')
  );
  const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [llmEnabled, setLlmEnabled] = useState<boolean>(() =>
    getInitialValue('sip_steady_llm_enabled', true, v => v === 'true')
  );
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState<boolean>(true);
  const [inbox, setInbox] = useState<InboxMessage[]>([
    {
      id: 'welcome-demo',
      kind: 'info',
      title: 'Demo data active',
      body: 'You are viewing SIP Steady prototype with mock data. No real money or accounts are connected.',
      date: '2026-11-08',
      read: true
    }
  ]);

  const [activeToast, setActiveToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Fetch personas list from API
  useEffect(() => {
    let cancelled = false;
    async function loadPersonas() {
      try {
        setIsLoadingPersonas(true);
        const res = await fetch('/api/v1/personas');
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.data) {
            setPersonas(json.data);
            setPersonaKeyState(curr => {
              const cleaned = curr.replace(/_s\d+$/, '');
              const exists = json.data.some((p: PersonaSummary) => p.key === cleaned);
              const valid = exists ? cleaned : (json.data[0]?.key || DEFAULT_PERSONA);
              if (valid !== curr) {
                try {
                  localStorage.setItem('sip_steady_persona', valid);
                } catch {
                  /* ignore */
                }
              }
              return valid;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load personas from API', err);
      } finally {
        if (!cancelled) setIsLoadingPersonas(false);
      }
    }
    loadPersonas();
    return () => {
      cancelled = true;
    };
  }, []);

  // Dynamic Notifications Sync: Pre-debit alerts, Restart reminders, Debit failure notices
  useEffect(() => {
    let cancelled = false;

    async function evaluateNotifications() {
      try {
        const cleanKey = personaKey.replace(/_s\d+$/, '') || 'early-flat';
        const res = await fetch(`/api/v1/sips?persona=${cleanKey}&asOf=${asOf}`);
        if (!res.ok) return;
        const json = await res.json();
        const summaries: SipSummary[] = json.data || [];

        const newMessages: InboxMessage[] = [];

        for (const s of summaries) {
          try {
            const detailRes = await fetch(`/api/v1/sips/${s.id}?asOf=${asOf}`);
            if (!detailRes.ok) continue;
            const detailJson = await detailRes.json();
            const bundle = detailJson.data;
            if (!bundle) continue;

            const sip = bundle.sip;
            const pause = bundle.pause;
            const failures = bundle.failures || [];
            const activeFailure = failures.find((f: { resolved: boolean }) => !f.resolved);

            // 1. Restarting SIP alert: when inside the 14-day window before pauseEnd
            if (pause && pause.pauseEnd && (pause.state === 'ACTIVE' || pause.state === 'SCHEDULED')) {
              const daysToRestart = diffDays(asOf, pause.pauseEnd) + 1;
              if (daysToRestart > 0 && daysToRestart <= 14) {
                newMessages.push({
                  id: `restart-${sip.id}-${pause.pauseEnd}`,
                  kind: 'reminder',
                  title: `Upcoming SIP restart · ${sip.schemeName.split(' ')[0]}`,
                  body: `Your SIP for ${sip.schemeName} was scheduled to resume on ${formatDate(pause.pauseEnd)}. Choose to resume, extend the pause, or leave it paused.`,
                  date: asOf,
                  sipId: sip.id,
                  read: false
                });
              }
            }

            // 2. Debit Day alerts for active SIPs
            if (s.status === 'ACTIVE' && sip.investmentDate) {
              const anchorDay = Number(sip.investmentDate.split('-')[2]);
              const asOfDateObj = new Date(toMs(asOf));
              const asOfYear = asOfDateObj.getUTCFullYear();
              const asOfMonth = asOfDateObj.getUTCMonth();
              const asOfDay = asOfDateObj.getUTCDate();

              // Compute next scheduled debit date
              let debitYear = asOfYear;
              let debitMonth = asOfMonth;
              if (asOfDay > anchorDay) {
                debitMonth += 1;
                if (debitMonth > 11) {
                  debitMonth = 0;
                  debitYear += 1;
                }
              }
              const dim = new Date(Date.UTC(debitYear, debitMonth + 1, 0)).getUTCDate();
              const targetDay = Math.min(anchorDay, dim);
              const nextDebitDate = fromMs(Date.UTC(debitYear, debitMonth, targetDay));

              const daysUntil = diffDays(asOf, nextDebitDate);
              const amountFormatted = `₹${(sip.instalmentAmountPaise / 100).toLocaleString('en-IN')}`;

              if (daysUntil === 1) {
                newMessages.push({
                  id: `pre-debit-${sip.id}-${nextDebitDate}`,
                  kind: 'alert',
                  title: `Tomorrow is debit day · ${sip.schemeName.split(' ')[0]}`,
                  body: `${amountFormatted} will be automatically debited tomorrow (${formatDate(nextDebitDate)}) for ${sip.schemeName}. Keep sufficient bank balance to maintain your investment.`,
                  date: asOf,
                  sipId: sip.id,
                  read: false
                });
              } else if (daysUntil === 0) {
                newMessages.push({
                  id: `debit-today-${sip.id}-${nextDebitDate}`,
                  kind: 'payment',
                  title: `Debit day today · ${sip.schemeName.split(' ')[0]}`,
                  body: `Today is your scheduled SIP instalment date (${formatDate(nextDebitDate)}). Your instalment of ${amountFormatted} is being processed.`,
                  date: asOf,
                  sipId: sip.id,
                  read: false
                });
              }
            }

            // 3. Payment failure alert
            if (activeFailure) {
              const amountFormatted = `₹${(activeFailure.amountPaise / 100).toLocaleString('en-IN')}`;
              newMessages.push({
                id: `failure-${sip.id}-${activeFailure.id}`,
                kind: 'payment',
                title: `Debit missed · ${sip.schemeName.split(' ')[0]}`,
                body: `Your instalment of ${amountFormatted} could not be debited. Your SIP schedule remains active. Tap to diagnose cause and retry.`,
                date: asOf,
                sipId: sip.id,
                read: false
              });
            }
          } catch {
            /* ignore individual sip error */
          }
        }

        if (!cancelled && newMessages.length > 0) {
          setInbox(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const fresh = newMessages.filter(m => !existingIds.has(m.id));
            if (fresh.length > 0 && fresh[0]) {
              setActiveToast(`${fresh[0].title}`);
              setTimeout(() => setActiveToast(null), 4500);
              return [...fresh, ...prev];
            }
            return prev;
          });
        }
      } catch {
        /* ignore */
      }
    }

    evaluateNotifications();

    return () => {
      cancelled = true;
    };
  }, [personaKey, asOf]);

  const setPersonaKey = useCallback((key: string) => {
    setPersonaKeyState(key);
    try {
      localStorage.setItem('sip_steady_persona', key);
    } catch {
      /* ignore */
    }
  }, []);

  const setAsOf = useCallback((date: string) => {
    setAsOfState(date);
    try {
      localStorage.setItem('sip_steady_date', date);
    } catch {
      /* ignore */
    }
  }, []);

  const advanceDays = useCallback((days: number) => {
    setAsOfState(prev => {
      const next = addDays(prev, days);
      try {
        localStorage.setItem('sip_steady_date', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleHideAmounts = useCallback(() => {
    setHideAmounts(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sip_steady_hide_amounts', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const toggleLlm = useCallback(() => {
    setLlmEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sip_steady_llm_enabled', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const addInboxMessage = useCallback((msg: Omit<InboxMessage, 'id' | 'read'>) => {
    const newMsg: InboxMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      read: false
    };
    setInbox(prev => [newMsg, ...prev]);
  }, []);

  const markMessageRead = useCallback((id: string) => {
    setInbox(prev => prev.map(m => (m.id === id ? { ...m, read: true } : m)));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPersonaKeyState(DEFAULT_PERSONA);
    setAsOfState(DEFAULT_AS_OF);
    setHideAmounts(false);
    setLlmEnabled(true);
    setInbox([
      {
        id: 'welcome-demo',
        kind: 'info',
        title: 'Demo reset completed',
        body: 'Demo state has been restored to default fixtures.',
        date: DEFAULT_AS_OF,
        read: false
      }
    ]);
    try {
      localStorage.removeItem('sip_steady_persona');
      localStorage.removeItem('sip_steady_date');
      localStorage.removeItem('sip_steady_hide_amounts');
      localStorage.removeItem('sip_steady_llm_enabled');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      personaKey,
      setPersonaKey,
      personas,
      asOf,
      setAsOf,
      advanceDays,
      hideAmounts,
      toggleHideAmounts,
      isDrawerOpen,
      setDrawerOpen,
      toggleDrawer,
      llmEnabled,
      toggleLlm,
      inbox,
      addInboxMessage,
      markMessageRead,
      resetToDefaults,
      isLoadingPersonas,
      activeToast,
      dismissToast
    }),
    [
      personaKey,
      setPersonaKey,
      personas,
      asOf,
      setAsOf,
      advanceDays,
      hideAmounts,
      toggleHideAmounts,
      isDrawerOpen,
      toggleDrawer,
      llmEnabled,
      toggleLlm,
      inbox,
      addInboxMessage,
      markMessageRead,
      resetToDefaults,
      isLoadingPersonas,
      activeToast,
      dismissToast
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
