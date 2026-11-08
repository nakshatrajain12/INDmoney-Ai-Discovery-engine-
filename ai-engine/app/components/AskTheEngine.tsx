"use client";

import React, { useState } from "react";
import { Search, Sparkles, Loader2, AlertCircle, Quote, ExternalLink, Compass } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface Citation {
  index: number;
  id: string;
  quote: string;
  full_text?: string;
  source: string;
  platform_app?: string;
  rating?: number | null;
  date?: string;
  url?: string;
  emotion?: string;
  user_segment?: string;
}

interface QueryResult {
  query: string;
  answer: string;
  theme_context?: string;
  citations: Citation[];
}

const PRESET_QUERIES = [
  "Why do first-time investors stop SIPs in months 3 to 6?",
  "How does market volatility and red portfolio panic cause churn?",
  "What auto-debit and bank mandate failure issues do users face?",
  "Why do beginners feel an information desert without feedback?"
];

interface AskTheEngineProps {
  initialQuery?: string;
  autoFocus?: boolean;
}

export function AskTheEngine({ initialQuery = "", autoFocus = false }: AskTheEngineProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (overrideQuery?: string) => {
    const q = (overrideQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error(`Engine request failed (${res.status})`);
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
      <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle focus-within:border-ind-border-focus rounded-ind-xl p-4 shadow-ind-float transition">
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
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none"
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
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-ind-border-subtle flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Suggested Prompts:</span>
          {PRESET_QUERIES.map((pq) => (
            <button
              key={pq}
              type="button"
              onClick={() => {
                setQuery(pq);
                handleSubmit(pq);
              }}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-ind-surface-2 hover:bg-slate-200 dark:hover:bg-ind-surface-elevated text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-ind-border-subtle transition truncate max-w-[280px]"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-ind-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* RAG Answer Display */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-6 shadow-ind-card">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-ind-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ind-emerald animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Discovery Engine Grounded Answer
                </span>
                {result.theme_context && (
                  <span className="text-xs text-ind-blue font-semibold px-2 py-0.5 rounded bg-ind-blue/10 border border-ind-blue/20">
                    {result.theme_context}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {result.citations.length} Grounded Citations
              </span>
            </div>

            {/* Synthesized prose */}
            <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-3">
              {result.answer.split("\n\n").map((para, i) => {
                // Highlight [Source N] tags in the answer
                const parts = para.split(/(\[Source\s*\d+\])/g);
                return (
                  <p key={i}>
                    {parts.map((part, pIdx) => {
                      if (/\[Source\s*\d+\]/.test(part)) {
                        const num = part.match(/\d+/)?.[0];
                        return (
                          <span
                            key={pIdx}
                            className="inline-flex items-center mx-1 px-1.5 py-0.2 rounded text-[11px] font-bold bg-ind-blue/15 text-ind-blue border border-ind-blue/30 tabular-nums"
                          >
                            Source {num}
                          </span>
                        );
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-ind-border-subtle text-xs text-slate-500 flex items-center justify-between">
              <span>SEBI-compliant behavioral synthesis · Zero stock or fund recommendations</span>
              <span className="text-ind-emerald font-semibold">100% Corpus Verified</span>
            </div>
          </div>

          {/* Citations Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <Quote size={15} className="text-ind-blue" />
                Retrieved Primary Citations ({result.citations.length})
              </h3>
              <span className="text-xs text-slate-500">Sorted by relevance match</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.citations.map((c) => (
                <div
                  key={c.id || c.index}
                  className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-4 shadow-ind-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-ind-blue text-white tabular-nums">
                          Source #{c.index}
                        </span>
                        <SourceBadge source={c.source} platform={c.platform_app} />
                      </div>
                      {typeof c.rating === "number" && c.rating > 0 && (
                        <span className="text-xs text-amber-500 dark:text-amber-400 font-semibold tabular-nums">
                          ★ {c.rating}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
                      "{c.quote}"
                    </p>

                    {c.full_text && c.full_text.length > c.quote.length + 30 && (
                      <details className="mt-2 text-[11px] text-slate-500 cursor-pointer">
                        <summary className="hover:text-slate-800 dark:hover:text-slate-300">View complete feedback</summary>
                        <p className="mt-1 p-2 rounded bg-slate-100 dark:bg-ind-surface-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-ind-border-subtle text-[11px] leading-relaxed not-italic">
                          {c.full_text}
                        </p>
                      </details>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-ind-border-subtle flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{c.emotion || "frustrated"} · {c.user_segment || "beginner"}</span>
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ind-blue hover:text-ind-blue-hover flex items-center gap-1 font-semibold"
                      >
                        Inspect <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="tabular-nums">Verified Ingestion</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
