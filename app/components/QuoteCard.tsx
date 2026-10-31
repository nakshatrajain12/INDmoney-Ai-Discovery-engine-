import React from "react";
import { SourceBadge } from "./SourceBadge";
import { ExternalLink, Star } from "lucide-react";

export interface QuoteData {
  id?: string;
  quote: string;
  full_text?: string;
  source?: string;
  platform_app?: string;
  rating?: number | null;
  date?: string;
  url?: string;
  emotion?: string;
  user_segment?: string;
  sentiment?: string;
}

interface QuoteCardProps {
  quote: QuoteData;
  className?: string;
}

export function QuoteCard({ quote, className = "" }: QuoteCardProps) {
  const getEmotionBadge = (emo?: string) => {
    const e = (emo || "").toLowerCase();
    if (e.includes("anxious") || e.includes("fear") || e.includes("panic")) {
      return "bg-rose-950/50 text-rose-300 border-rose-500/30";
    }
    if (e.includes("frustrated") || e.includes("angry")) {
      return "bg-amber-950/50 text-amber-300 border-amber-500/30";
    }
    if (e.includes("confused")) {
      return "bg-blue-950/50 text-blue-300 border-blue-500/30";
    }
    if (e.includes("hopeful") || e.includes("confident") || e.includes("reassured")) {
      return "bg-emerald-950/50 text-emerald-300 border-emerald-500/30";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className={`bg-ind-surface-1 border border-ind-border-subtle hover:border-ind-blue/40 rounded-ind-lg p-5 transition shadow-ind-card flex flex-col justify-between ${className}`}>
      <div>
        {/* Header: Source badge, Stars, Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <SourceBadge source={quote.source} platform={quote.platform_app} />
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {typeof quote.rating === "number" && quote.rating > 0 && (
              <div className="flex items-center text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={11}
                    className={i < (quote.rating || 0) ? "fill-amber-400" : "text-slate-600"}
                  />
                ))}
              </div>
            )}
            {quote.date && <span className="tabular-nums">{quote.date}</span>}
          </div>
        </div>

        {/* Verbatim Quote Body */}
        <p className="text-sm text-slate-200 leading-relaxed font-normal italic">
          "{quote.quote || quote.full_text || "No quote text available."}"
        </p>

        {quote.full_text && quote.full_text.length > quote.quote.length + 30 && (
          <details className="mt-2 text-xs text-slate-400 cursor-pointer">
            <summary className="hover:text-slate-200 transition">View full review</summary>
            <p className="mt-1.5 p-2.5 rounded bg-ind-surface-2 text-slate-300 not-italic border border-ind-border-subtle text-[11px] leading-relaxed">
              {quote.full_text}
            </p>
          </details>
        )}
      </div>

      {/* Footer: Tags & External Link */}
      <div className="mt-4 pt-3 border-t border-ind-border-subtle flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {quote.emotion && (
            <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border ${getEmotionBadge(quote.emotion)}`}>
              {quote.emotion}
            </span>
          )}
          {quote.user_segment && (
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {quote.user_segment}
            </span>
          )}
        </div>

        {quote.url ? (
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ind-blue hover:text-ind-blue-hover transition"
          >
            Original Post
            <ExternalLink size={11} />
          </a>
        ) : (
          <span className="text-[10px] text-slate-500">Verified signal</span>
        )}
      </div>
    </div>
  );
}
