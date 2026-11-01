import React from "react";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { QuoteCard } from "../../components/QuoteCard";
import { OpportunityScoreBar } from "../../components/OpportunityScoreBar";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Quote, ShieldAlert, BarChart3, Clock, Users } from "lucide-react";

interface ThemeDrillDownProps {
  params: {
    id: string;
  };
}

async function getTheme(id: string) {
  try {
    const filePath = path.join(process.cwd(), "data", "themes", "themes.json");
    if (fs.existsSync(filePath)) {
      const themes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return themes.find((t: any) => t.id === id) || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default async function ThemeDrillDownPage({ params }: ThemeDrillDownProps) {
  const theme = await getTheme(params.id);

  if (!theme) {
    notFound();
  }

  const sb = theme.score_breakdown;
  const quotes = theme.representative_quotes || [];

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/themes"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-semibold"
        >
          <ArrowLeft size={14} />
          Back to Opportunity Matrix
        </Link>
      </div>

      {/* Theme Hero Banner (Signature Financial Surface) */}
      <section className="bg-white dark:bg-gradient-to-br dark:from-[#0F172A] dark:to-[#1E293B] border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-8 shadow-sm dark:shadow-ind-float relative overflow-hidden text-slate-900 dark:text-white transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald border border-emerald-200 dark:border-ind-emerald/30">
                Rank #{theme.rank || 1} Opportunity
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Theme ID: {theme.id}</span>
              {theme.discovery_questions.map((dq: string) => (
                <span
                  key={dq}
                  className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {dq}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {theme.name}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {theme.description}
            </p>

            {/* Core Behavioral Insight Callout */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-l-4 border-ind-emerald rounded-r-ind-md text-sm text-slate-800 dark:text-slate-200">
              <span className="text-xs font-bold text-ind-emerald uppercase tracking-wider block mb-1">
                Core Behavioral Insight
              </span>
              {theme.key_insight}
            </div>
          </div>

          {/* Opportunity Score Card Dial */}
          <div className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-ind-lg p-5 text-right min-w-[240px] flex-shrink-0 shadow-sm dark:shadow-ind-card">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Opportunity Score
            </div>
            <div className="text-4xl font-bold text-ind-emerald tabular-nums my-1">
              {theme.opportunity_score.toFixed(3)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {theme.volume_count.toLocaleString()} user signals ({theme.volume_percentage}%)
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Frequency (30%):</span>
                <span className="text-slate-800 dark:text-slate-200 tabular-nums font-semibold">{(sb.frequency * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Severity (30%):</span>
                <span className="text-slate-800 dark:text-slate-200 tabular-nums font-semibold">{(sb.severity * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Actionability (25%):</span>
                <span className="text-slate-800 dark:text-slate-200 tabular-nums font-semibold">{(sb.actionability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Recency (15%):</span>
                <span className="text-slate-800 dark:text-slate-200 tabular-nums font-semibold">{(sb.recency * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/60">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Formula Factor Distribution
          </div>
          <OpportunityScoreBar
            frequency={sb.frequency}
            severity={sb.severity}
            actionability={sb.actionability}
            recency={sb.recency}
          />
        </div>
      </section>

      {/* Suggested Product Interventions */}
      <section className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-6 shadow-ind-card">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-ind-emerald" />
          Recommended INDmoney Product Interventions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {theme.suggested_interventions?.map((inv: string, i: number) => {
            const [title, ...rest] = inv.split(":");
            return (
              <div
                key={i}
                className="bg-slate-100 dark:bg-ind-surface-2 p-4 rounded-ind-md border border-slate-200 dark:border-ind-border-subtle flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-ind-blue uppercase tracking-wider">
                    Strategy #{i + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-2">
                    {title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rest.join(":").trim()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Segment & Emotional Analytics Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Experience Level */}
        <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={14} className="text-ind-blue" />
            Experience Level
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(theme.segment_breakdown?.experience_level || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="capitalize text-slate-600 dark:text-slate-300">{k.replace("_", " ")}</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{v as number} items</span>
              </div>
            ))}
          </div>
        </div>

        {/* SIP Lifecycle Tenure */}
        <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-ind-warn" />
            SIP Tenure Window
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(theme.segment_breakdown?.sip_tenure || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="capitalize text-slate-600 dark:text-slate-300">{k.replace("_", " ")}</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{v as number} items</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Distribution */}
        <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-ind-coral" />
            Emotion Breakdown
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(theme.emotion_distribution || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="capitalize text-slate-600 dark:text-slate-300">{k}</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{v as number}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verbatim Supporting Evidence Gallery */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Quote size={18} className="text-ind-blue" />
              Verbatim User Evidence ({quotes.length} Quotes)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Extracted verbatim user quotes grounding this theme from real investors across all sources.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((q: any, i: number) => (
            <QuoteCard key={q.id || i} quote={q} />
          ))}
        </div>
      </section>
    </main>
  );
}
