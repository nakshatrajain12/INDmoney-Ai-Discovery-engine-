"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FilterChips } from "../components/FilterChips";
import { ThemeCard, ThemeSummary } from "../components/ThemeCard";
import { PieChart, Users, Clock, Compass, ArrowRight, BarChart2, CheckCircle2 } from "lucide-react";

const EXPERIENCE_OPTIONS = [
  { id: "all", label: "All Experience Levels" },
  { id: "first_timer", label: "First-timers (<6 mo)" },
  { id: "beginner", label: "Beginner Investors" },
  { id: "intermediate", label: "Intermediate" },
  { id: "experienced", label: "Experienced / Pro" },
];

const TENURE_OPTIONS = [
  { id: "all", label: "All Tenures" },
  { id: "month_1", label: "Month 1 (Onboarding)" },
  { id: "months_1_3", label: "Months 1–3" },
  { id: "months_3_6", label: "Months 3–6 (Cliff)" },
  { id: "months_6_12", label: "Months 6–12" },
  { id: "beyond_12", label: "Beyond 12 Months" },
];

export default function SegmentsPage() {
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [selectedExp, setSelectedExp] = useState("all");
  const [selectedTenure, setSelectedTenure] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/themes?matrix=true");
        if (res.ok) {
          const data = await res.json();
          setThemes(data.themes || []);
        }
      } catch (e) {
        console.error("Error loading segment themes", e);
      } finally {
        setLoading(false);
      }
    }
    fetchThemes();
  }, []);

  // Compute dynamic segment-weighted themes
  const reRankedThemes = themes
    .map((theme: any) => {
      let segmentMultiplier = 1.0;
      const expCounts = theme.segment_breakdown?.experience_level || {};
      const tenureCounts = theme.segment_breakdown?.sip_tenure || {};

      if (selectedExp !== "all") {
        const count = expCounts[selectedExp] || 0;
        const total = Object.values(expCounts).reduce((a: any, b: any) => a + b, 0) as number;
        const ratio = total > 0 ? count / total : 0.2;
        segmentMultiplier *= 0.5 + ratio * 1.5;
      }

      if (selectedTenure !== "all") {
        const count = tenureCounts[selectedTenure] || 0;
        const total = Object.values(tenureCounts).reduce((a: any, b: any) => a + b, 0) as number;
        const ratio = total > 0 ? count / total : 0.2;
        segmentMultiplier *= 0.5 + ratio * 1.5;
      }

      const segmentScore = Math.min(0.999, theme.opportunity_score * segmentMultiplier);

      return {
        ...theme,
        segment_adjusted_score: segmentScore,
      };
    })
    .sort((a, b) => b.segment_adjusted_score - a.segment_adjusted_score);

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <section className="bg-white dark:bg-gradient-to-r dark:from-ind-surface-1 dark:to-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-8 shadow-ind-float">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ind-emerald animate-pulse" />
          <span className="text-[11px] font-bold text-ind-blue uppercase tracking-wider">
            COHORT INTELLIGENCE ENGINE
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald font-semibold border border-emerald-200 dark:border-ind-emerald/20">
            DYNAMIC RE-RANKING
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Investor Segment & Lifecycle Matrix
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Drop-off dynamics differ drastically across investor cohorts. First-timers panic over small market dips in Months 1–3, whereas experienced investors churn over app performance and execution lag. Select a cohort below to re-rank the opportunity matrix dynamically.
        </p>
      </section>

      {/* Cohort Filter Controls */}
      <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-6 shadow-ind-card space-y-6">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Users size={14} className="text-ind-blue" />
            Filter by Investor Experience Level:
          </div>
          <FilterChips
            options={EXPERIENCE_OPTIONS}
            selectedId={selectedExp}
            onChange={setSelectedExp}
            activeColor="blue"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-ind-border-subtle">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-ind-warn" />
            Filter by SIP Tenure Stage:
          </div>
          <FilterChips
            options={TENURE_OPTIONS}
            selectedId={selectedTenure}
            onChange={setSelectedTenure}
            activeColor="emerald"
          />
        </div>
      </div>

      {/* Side-by-Side Cohort Behavioral Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ind-coral" />
              First-Timers / Beginners (Month 1–3)
            </h3>
            <span className="text-xs text-ind-coral font-semibold">High Drop-off Propensity</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Equate paper losses with permanent erosion. Drop-off occurs within 90 days if negative returns appear. Require proactive emotional reassurance and drawdown recovery context.
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div>• Top Pain Point: <strong className="text-slate-800 dark:text-slate-200">Red Portfolio Panic (T1)</strong></div>
            <div>• Primary Friction: <strong className="text-slate-800 dark:text-slate-200">Unclear XIRR calculation (T3)</strong></div>
            <div>• Dominant Emotion: <strong className="text-slate-800 dark:text-slate-200">Anxious (High Intensity)</strong></div>
          </div>
        </div>

        <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ind-blue" />
              Experienced Investors (6–12+ Months)
            </h3>
            <span className="text-xs text-ind-blue font-semibold">Discipline-Driven</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Understand compounding and market cycles, but churn aggressively if auto-debit fails, unit allocation lags, or customer care is locked behind automated unhelpful bots.
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div>• Top Pain Point: <strong className="text-slate-800 dark:text-slate-200">Mandate & Auto-Debit Friction (T4)</strong></div>
            <div>• Primary Friction: <strong className="text-slate-800 dark:text-slate-200">Customer Support Bot Loops (T9)</strong></div>
            <div>• Dominant Emotion: <strong className="text-slate-800 dark:text-slate-200">Frustrated / Angry</strong></div>
          </div>
        </div>
      </div>

      {/* Dynamic Re-ranked Opportunity Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart2 size={18} className="text-ind-emerald" />
            Cohort-Adjusted Opportunity Rankings
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Active Filter: <strong className="text-slate-900 dark:text-white capitalize">{selectedExp.replace("_", " ")}</strong> · <strong className="text-slate-900 dark:text-white capitalize">{selectedTenure.replace("_", " ")}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reRankedThemes.map((t, idx) => (
            <div
              key={t.id}
              className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle hover:border-ind-blue/40 rounded-ind-lg p-5 transition shadow-ind-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-ind-surface-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-ind-border-subtle tabular-nums">
                    Cohort Rank #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-ind-emerald tabular-nums">
                    Score: {(t.segment_adjusted_score || t.opportunity_score).toFixed(3)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{t.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{t.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-ind-border-subtle flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Corpus Share: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{t.volume_percentage}%</strong>
                </span>
                <Link
                  href={`/themes/${t.id}`}
                  className="text-ind-blue hover:text-ind-blue-hover font-semibold flex items-center gap-1"
                >
                  View Evidence
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
