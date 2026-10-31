"use client";

import React, { useState } from "react";
import { Sparkles, Search, Loader2, BookOpen, AlertCircle, ExternalLink } from "lucide-react";
import { QuoteCard } from "./QuoteCard";

interface CitationItem {
  index: number;
  id: string;
  quote: string;
  full_text?: string;
  source?: string;
  platform_app?: string;
  rating?: number | null;
  date?: string;
  url?: string;
  emotion?: string;
  user_segment?: string;
}

interface RAGResponse {
  query: string;
  answer: string;
  citations: CitationItem[];
  theme_context?: string;
}

const PRESET_QUERIES = [
  "Why do first-timers cancel SIPs in months 1-3?",
  "What causes the Month 3-6 drop-off cliff?",
  "How does auto-debit and mandate friction impact retention?",
  "Why do users check YouTube/Reddit instead of in-app help?",
  "What unmet needs do SIP investors voice most frequently?"
];

export function AskTheEngine({ initialQuery = "", autoFocus = false }: { initialQuery?: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const handleSubmit = async (qToSubmit?: string) => {
    const q = (qToSubmit || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setQuery(q);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error(`Query failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve synthesized answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="bg-ind-surface-1 border border-ind-border-subtle focus-within:border-ind-border-focus rounded-ind-xl p-4 shadow-ind-float transition">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-ind-md bg-gradient-to-tr from-ind-blue to-ind-emerald flex items-center justify-center flex-shrink-0 text-white">
            <Sparkles size={18} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the Discovery Copilot: e.g. Why do investors stop SIPs when market drops?"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
            autoFocus={autoFocus}
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-ind-md bg-ind-blue hover:bg-ind-blue-hover disabled:opacity-50 text-white text-xs font-semibold shadow-ind-glow transition flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Search size={13} />
                Ask Engine
              </>
            )}
          </button>
        </form>

        {/* Pre-loaded Prompt Chips */}
        <div className="mt-3 pt-3 border-t border-ind-border-subtle flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Suggested Prompts:</span>
          {PRESET_QUERIES.map((pq) => (
            <button
              key={pq}
              type="button"
              onClick={() => handleSubmit(pq)}
              className="text-xs px-2.5 py-1 rounded-full bg-ind-surface-2 hover:bg-ind-surface-elevated text-slate-300 hover:text-white border border-ind-border-subtle transition truncate max-w-[280px]"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-ind-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* RAG Answer Display */}
      {result && (
        <div className="space-y-6">
          <div className="bg-ind-surface-1 border border-ind-border-subtle rounded-ind-xl p-6 shadow-ind-card">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-ind-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ind-emerald animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Discovery Engine Grounded Answer
                </span>
                {result.theme_context && (
                  <span className="text-xs text-ind-blue font-semibold px-2 py-0.5 rounded bg-ind-blue/10 border border-ind-blue/20">
                    {result.theme_context}
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-400 tabular-nums">
                {result.citations?.length || 0} Verbatim Citations Grounded
              </span>
            </div>

            {/* Answer Body with Clickable Citation Links */}
            <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed space-y-3">
              {result.answer.split("\n\n").map((para, pIdx) => {
                // Highlight [Source N] notation
                const parts = para.split(/(\[Source\s*\d+\])/g);
                return (
                  <p key={pIdx}>
                    {parts.map((part, idx) => {
                      const match = part.match(/\[Source\s*(\d+)\]/);
                      if (match) {
                        const citIdx = parseInt(match[1], 10);
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveCitation(citIdx)}
                            className="inline-flex items-center mx-1 px-1.5 py-0.2 rounded text-[11px] font-bold bg-ind-blue/20 hover:bg-ind-blue/40 text-ind-blue border border-ind-blue/30 tabular-nums transition"
                          >
                            [Source {citIdx}]
                          </button>
                        );
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Evidence Citations Gallery */}
          {result.citations && result.citations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <BookOpen size={14} className="text-ind-emerald" />
                  Retrieved Verbatim Evidence
                </h3>
                <span className="text-xs text-slate-400">
                  Click any [Source N] in text to inspect original user quote
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.citations.map((c) => (
                  <div
                    key={c.id || c.index}
                    id={`citation-${c.index}`}
                    className={`transition duration-200 rounded-ind-lg ${
                      activeCitation === c.index ? "ring-2 ring-ind-blue" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between px-3 py-1.5 bg-ind-surface-2 rounded-t-ind-lg border-t border-x border-ind-border-subtle text-xs">
                      <span className="font-bold text-ind-blue tabular-nums">Source #{c.index}</span>
                      <span className="text-slate-400 text-[11px]">{c.platform_app || "INDmoney"}</span>
                    </div>
                    <QuoteCard quote={c} className="rounded-t-none border-t-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

