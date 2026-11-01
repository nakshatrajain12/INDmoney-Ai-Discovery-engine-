import React from "react";
import Link from "next/link";
import { OpportunityScoreBar } from "./OpportunityScoreBar";
import { ArrowRight, Flame, Quote, Sparkles } from "lucide-react";

export interface ThemeSummary {
  id: string;
  name: string;
  rank?: number;
  discovery_questions: string[];
  description: string;
  key_insight: string;
  opportunity_score: number;
  opportunity_score_100: number;
  score_breakdown: {
    frequency: number;
    severity: number;
    actionability: number;
    recency: number;
    multiplicative_score?: number;
  };
  volume_count: number;
  volume_percentage: number;
  top_emotion: string;
  representative_quotes?: Array<{
    quote: string;
    source?: string;
    platform_app?: string;
    date?: string;
    url?: string;
  }>;
}

interface ThemeCardProps {
  theme: ThemeSummary;
  className?: string;
}

export function ThemeCard({ theme, className = "" }: ThemeCardProps) {
  const topQuote = theme.representative_quotes?.[0]?.quote || theme.key_insight;

  return (
    <div className={`bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle hover:border-ind-blue/40 rounded-ind-lg p-6 transition duration-200 shadow-ind-card flex flex-col justify-between group ${className}`}>
      <div>
        {/* Top Header: Rank, Discovery Qs, Opportunity Score */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                (theme.rank || 1) <= 3
                  ? "bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald border border-emerald-200 dark:border-ind-emerald/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}>
                {(theme.rank || 1) <= 3 && <Flame size={11} className="fill-ind-emerald" />}
                Rank #{theme.rank || 1}
              </span>

              {theme.discovery_questions.map((dq) => (
                <span
                  key={dq}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-ind-surface-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-ind-border-subtle"
                >
                  {dq}
                </span>
              ))}

              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {theme.volume_count.toLocaleString()} signals ({theme.volume_percentage}%)
              </span>
            </div>

            <Link href={`/themes/${theme.id}`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-ind-blue transition tracking-tight">
                {theme.name}
              </h3>
            </Link>
          </div>

          <div className="text-right flex-shrink-0 bg-slate-50 dark:bg-ind-surface-2/80 px-3 py-1.5 rounded-ind-md border border-slate-200 dark:border-ind-border-subtle">
            <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Score</div>
            <div className="text-2xl font-bold text-ind-emerald tabular-nums">
              {theme.opportunity_score.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Theme Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-4">
          {theme.description}
        </p>

        {/* 4-Factor Formula Breakdown Progress Bar */}
        <div className="mb-4 bg-slate-50 dark:bg-ind-surface-2 p-3 rounded-ind-md border border-slate-200 dark:border-ind-border-subtle/60">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Opportunity Breakdown</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Freq · Sev · Act · Rec</span>
          </div>
          <OpportunityScoreBar
            frequency={theme.score_breakdown.frequency}
            severity={theme.score_breakdown.severity}
            actionability={theme.score_breakdown.actionability}
            recency={theme.score_breakdown.recency}
          />
        </div>

        {/* Verbatim Quote Snippet Callout */}
        <div className="bg-slate-50 dark:bg-ind-surface-2/60 border-l-2 border-ind-blue p-3 rounded-r-ind-sm text-xs text-slate-700 dark:text-slate-300 italic flex items-start gap-2 mb-4">
          <Quote size={13} className="text-ind-blue flex-shrink-0 mt-0.5" />
          <p className="line-clamp-2">"{topQuote}"</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-ind-border-subtle flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles size={12} className="text-ind-warn" />
          Dominant: <strong className="text-slate-800 dark:text-slate-200 capitalize">{theme.top_emotion}</strong>
        </span>

        <Link
          href={`/themes/${theme.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-ind-blue hover:text-ind-blue-hover transition"
        >
          Explore Evidence
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
