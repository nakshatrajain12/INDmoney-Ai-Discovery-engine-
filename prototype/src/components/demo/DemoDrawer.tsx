'use client';

import React, { useState } from 'react';
import { X, Clock, Users, Code, RotateCcw, Sparkles } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { cn } from '@/lib/utils';

export function DemoDrawer() {
  const {
    isDrawerOpen,
    setDrawerOpen,
    personaKey,
    setPersonaKey,
    personas,
    asOf,
    setAsOf,
    advanceDays,
    llmEnabled,
    toggleLlm,
    resetToDefaults,
    isLoadingPersonas
  } = useDemo();

  const [activeTab, setActiveTab] = useState<'personas' | 'clock' | 'inspector'>('personas');
  const [filterTag, setFilterTag] = useState<string>('all');

  if (!isDrawerOpen) return null;

  // Filter personas by tag
  const filteredPersonas = personas.filter(p => {
    if (filterTag === 'all') return true;
    if (filterTag === 'early-flat') return p.key.startsWith('early-flat');
    if (filterTag === 'positive') return p.key.startsWith('positive');
    if (filterTag === 'debit') return p.key.startsWith('debit');
    if (filterTag === 'pause') return p.key.includes('pause');
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) setDrawerOpen(false);
      }}
    >
      <div className="w-full max-w-md h-full bg-s1 border-l border-border flex flex-col shadow-ind-float animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-canvas/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ind-emerald-text">
              Prototype Controls
            </span>
            <h2 id="demo-drawer-title" className="text-base font-bold text-t1 tracking-tight">
              Demo Drawer & Rule Inspector
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close demo drawer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-s2 text-t2 hover:bg-elev focus-visible:outline-2 focus-visible:outline-focus"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Controls: Personas | Clock | Inspector */}
        <div className="flex border-b border-border bg-s2 px-3 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('personas')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors min-h-[44px]',
              activeTab === 'personas'
                ? 'border-ind-blue text-ind-blue'
                : 'border-transparent text-t2 hover:text-t1'
            )}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Personas ({personas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clock')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors min-h-[44px]',
              activeTab === 'clock'
                ? 'border-ind-blue text-ind-blue'
                : 'border-transparent text-t2 hover:text-t1'
            )}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>Time Travel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors min-h-[44px]',
              activeTab === 'inspector'
                ? 'border-ind-blue text-ind-blue'
                : 'border-transparent text-t2 hover:text-t1'
            )}
          >
            <Code className="h-4 w-4" aria-hidden="true" />
            <span>Settings</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'personas' && (
            <div className="space-y-3">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All 30' },
                  { id: 'early-flat', label: 'Early Flat' },
                  { id: 'positive', label: 'Positive' },
                  { id: 'debit', label: 'Debit Failures' },
                  { id: 'pause', label: 'Pause/Restart' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterTag(cat.id)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors min-h-[44px]',
                      filterTag === cat.id
                        ? 'border-ind-blue bg-ind-blue text-white'
                        : 'border-border bg-s2 text-t2 hover:bg-elev'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {isLoadingPersonas ? (
                <div className="py-8 text-center text-xs text-t2">Loading 30 personas...</div>
              ) : (
                <div className="space-y-2">
                  {filteredPersonas.map(p => {
                    const isSelected = p.key === personaKey;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setPersonaKey(p.key);
                          setAsOf(p.asOf);
                        }}
                        className={cn(
                          'w-full text-left rounded-xl border p-3 transition-all min-h-[44px]',
                          isSelected
                            ? 'border-ind-blue bg-ind-blue-soft/30 ring-1 ring-ind-blue'
                            : 'border-border bg-s2 hover:bg-elev'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs font-bold text-t1">{p.label}</div>
                            <div className="text-[11px] text-t3 mt-0.5 line-clamp-1">
                              {p.description}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="rounded-full bg-ind-blue px-2 py-0.5 text-[10px] font-bold text-white shrink-0 ml-2">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-t3">
                          <span>Key: {p.key}</span>
                          <span>·</span>
                          <span>AsOf: {p.asOf}</span>
                          <span>·</span>
                          <span>SIPs: {p.sipCount}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'clock' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-s2 p-4 text-center">
                <span className="text-xs uppercase font-semibold text-t2">Current Demo Date (asOf)</span>
                <div className="text-2xl font-bold tabular-nums text-t1 mt-1">{asOf}</div>
                <p className="text-[11px] text-t3 mt-1">
                  Adjusting the date simulates passing of time, triggering calm reminders and automatic SIP resumptions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => advanceDays(1)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-s2 px-3 text-xs font-semibold text-t1 hover:bg-elev"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => advanceDays(7)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-s2 px-3 text-xs font-semibold text-t1 hover:bg-elev"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  onClick={() => advanceDays(30)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-s2 px-3 text-xs font-semibold text-t1 hover:bg-elev"
                >
                  +30 Days (1 Month)
                </button>
                <button
                  type="button"
                  onClick={() => setAsOf('2026-11-08')}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-s2 px-3 text-xs font-semibold text-t1 hover:bg-elev"
                >
                  Reset to 08 Nov 2026
                </button>
              </div>
            </div>
          )}

          {activeTab === 'inspector' && (
            <div className="space-y-4">
              {/* LLM Edge Mode Toggle */}
              <div className="rounded-xl border border-border bg-s2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-ind-blue" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-bold text-t1">Generative Edge Mode</div>
                      <div className="text-[11px] text-t3">Bounded zero-digit rephraser</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleLlm}
                    aria-label="Toggle LLM generative edge"
                    className={cn(
                      'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-focus',
                      llmEnabled ? 'bg-ind-blue' : 'bg-line'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                        llmEnabled ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-t2 leading-relaxed">
                  When enabled, Return Coach runs bounded prose rephrasing with zero-digit validation. When disabled, it uses pre-compiled deterministic templates directly.
                </p>
              </div>

              {/* Reset Everything Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-s2 px-4 text-xs font-semibold text-t2 hover:text-ind-coral-text hover:bg-elev"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Reset Prototype to Factory Defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
