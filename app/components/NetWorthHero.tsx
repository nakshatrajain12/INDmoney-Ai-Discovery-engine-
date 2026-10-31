import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, TrendingDown, Clock, Award } from "lucide-react";

interface NetWorthHeroProps {
  totalIngested?: number;
  totalFiltered?: number;
  criticalWindow?: string;
  primaryEmotion?: string;
  topScore?: number;
  className?: string;
}

export function NetWorthHero({
  totalIngested = 8179,
  totalFiltered = 3079,
  criticalWindow = "Months 3–6",
  primaryEmotion = "Red Portfolio Panic",
  topScore = 0.828,
  className = ""
}: NetWorthHeroProps) {
  return (
    <section className={`bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-ind-border-subtle rounded-ind-xl p-8 shadow-ind-float relative overflow-hidden ${className}`}>
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-ind-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-ind-emerald/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div>
          {/* Category Label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              TOTAL SIGNALS ANALYZED
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ind-emerald-subtle text-ind-emerald border border-ind-emerald/20">
              <ShieldCheck size={11} />
              100% VERIFIED CORPUS
            </span>
          </div>

          {/* Tabular Primary Value */}
          <div className="flex flex-wrap items-baseline gap-4">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
              {totalFiltered.toLocaleString()}
            </span>
            <span className="text-sm text-slate-400 tabular-nums">
              Clean 7D Extracted Points (from {totalIngested.toLocaleString()} Ingested Signals)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ind-emerald-subtle text-ind-emerald border border-ind-emerald/30 tabular-nums">
              ↑ 5 Sources Normalized
            </span>
          </div>

          <p className="text-slate-300 text-sm mt-3 max-w-2xl leading-relaxed">
            Multi-platform behavioral research corpus across Google Play, App Store, YouTube, TradingQ&A, and ValuePickr reverse-engineering drop-off friction to build INDmoney’s retention moat.
          </p>
        </div>

        {/* CTA Button Group */}
        <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-3 justify-center flex-shrink-0">
          <Link
            href="/themes"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ind-blue hover:bg-ind-blue-hover text-white text-sm font-semibold rounded-ind-md transition shadow-ind-glow"
          >
            Explore Top 10 Themes
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/ask"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ind-surface-2 hover:bg-ind-surface-elevated text-slate-200 text-sm font-semibold rounded-ind-md border border-ind-border-subtle transition"
          >
            <Sparkles size={14} className="text-ind-blue" />
            Ask Discovery Copilot
          </Link>
        </div>
      </div>

      {/* Bottom Hero Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/60 text-xs">
        <div>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock size={12} className="text-ind-warn" />
            <span>Critical Drop-off Window</span>
          </div>
          <span className="text-ind-warn font-semibold text-sm tabular-nums mt-1 block">
            {criticalWindow}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 text-slate-400">
            <TrendingDown size={12} className="text-ind-coral" />
            <span>Primary Emotion Trigger</span>
          </div>
          <span className="text-ind-coral font-semibold text-sm mt-1 block">
            {primaryEmotion}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 text-slate-400">
            <Award size={12} className="text-ind-emerald" />
            <span>Top Opportunity Benchmark</span>
          </div>
          <span className="text-ind-emerald font-semibold text-sm tabular-nums mt-1 block">
            {topScore.toFixed(3)} / 1.000
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck size={12} className="text-ind-blue" />
            <span>Evaluation Benchmark</span>
          </div>
          <span className="text-ind-blue font-semibold text-sm tabular-nums mt-1 block">
            20 Hand-Labeled Golden Set
          </span>
        </div>
      </div>
    </section>
  );
}

