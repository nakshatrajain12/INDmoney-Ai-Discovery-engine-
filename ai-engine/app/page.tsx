import React from "react";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { NetWorthHero } from "./components/NetWorthHero";
import { ThemeCard, ThemeSummary } from "./components/ThemeCard";
import { ExportResearchButton } from "./components/ExportResearchButton";
import { Sparkles, ArrowRight, BarChart2, ShieldAlert, PieChart, Layers, Download } from "lucide-react";

async function getThemes(): Promise<ThemeSummary[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "themes", "opportunity_matrix.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export default async function HomePage() {
  const themes = await getThemes();
  const topThemes = themes.slice(0, 5);

  const sourcesData = [
    { name: "Google Play Store", count: 6054, pct: "74.0%", color: "bg-emerald-500" },
    { name: "Apple App Store", count: 922, pct: "11.3%", color: "bg-blue-500" },
    { name: "YouTube Comments", count: 624, pct: "7.6%", color: "bg-red-500" },
    { name: "TradingQ&A (Zerodha)", count: 313, pct: "3.8%", color: "bg-indigo-500" },
    { name: "ValuePickr Forum", count: 266, pct: "3.3%", color: "bg-purple-500" },
  ];

  const churnWindows = [
    { window: "Month 1 (First SIP)", rate: "18.4%", risk: "High", trigger: "Setup friction & first negative day" },
    { window: "Months 3–6 (Cliff)", rate: "54.2%", risk: "Critical", trigger: "Unmet compounding & red portfolio panic" },
    { window: "Months 6–12 (Plateau)", rate: "21.6%", risk: "Moderate", trigger: "Market correction & lack of guidance" },
    { window: "Beyond 12 Months", rate: "5.8%", risk: "Low", trigger: "Established habit & long-term discipline" },
  ];

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Signature INDmoney Net Worth Hero Card */}
      <NetWorthHero
        totalIngested={8179}
        totalFiltered={3079}
        criticalWindow="Months 3–6"
        primaryEmotion="Red Portfolio Panic"
        topScore={themes[0]?.opportunity_score || 0.828}
      />

      {/* Asymmetric 2-Column Desktop Grid (65% Main / 35% Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Main Column (8 cols = ~65%) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart2 size={20} className="text-ind-emerald" />
                Top Ranked Retention Themes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prioritized by 4-Factor Opportunity Score (Frequency 30%, Severity 30%, Actionability 25%, Recency 15%)
              </p>
            </div>
            <Link
              href="/themes"
              className="text-xs text-ind-blue hover:text-ind-blue-hover font-semibold flex items-center gap-1 transition"
            >
              View All {themes.length} Themes
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Top 5 Theme Cards */}
          <div className="space-y-4">
            {topThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/themes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-ind-md bg-white dark:bg-ind-surface-1 hover:bg-slate-100 dark:hover:bg-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-sm"
            >
              <span>Explore All {themes.length} Ranked Themes & Full Evidence Matrix</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Sticky Rail (4 cols = ~35%) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Research Data Package Export Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-emerald-950/30 dark:via-ind-surface-1 dark:to-ind-surface-2 border border-emerald-500/30 rounded-ind-lg p-5 shadow-ind-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-ind-emerald animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-ind-emerald uppercase tracking-wider">
                Full Research Package
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Export Ground Truth Dataset
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Download ZIP with all 10 segments, 10 themes, 3,079 evidence rows, hypotheses, survey mapping & scoring math.
            </p>
            <ExportResearchButton variant="compact" className="w-full justify-center text-center" />
          </div>

          {/* Quick Ask Discovery Copilot Card */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-ind-surface-1 dark:to-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
            <div className="flex items-center gap-2 text-xs font-bold text-ind-blue uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              AI Discovery Copilot
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Query the 3,079 Analyzed Signals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Get grounded answers with verbatim user quotes for drop-off causes, UI confusion, and segment patterns.
            </p>
            <Link
              href="/ask"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ind-blue hover:bg-ind-blue-hover text-white text-xs font-semibold rounded-ind-md transition shadow-ind-glow"
            >
              Launch Copilot Search
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Critical Churn Windows Card */}
          <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-ind-warn" />
                SIP Lifecycle Churn Windows
              </h3>
            </div>
            <div className="space-y-3">
              {churnWindows.map((cw) => (
                <div
                  key={cw.window}
                  className="p-2.5 rounded-ind-sm bg-slate-100 dark:bg-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle/50 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cw.window}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded tabular-nums ${
                        cw.risk === "Critical"
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                          : cw.risk === "High"
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {cw.rate} Drop-off
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{cw.trigger}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Source Ingestion Breakdown */}
          <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <PieChart size={14} className="text-ind-emerald" />
                Corpus Distribution (8,179 Raw)
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              {sourcesData.map((src) => (
                <div key={src.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${src.color}`} />
                    <span className="text-slate-600 dark:text-slate-300 text-[11px]">{src.name}</span>
                  </div>
                  <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                    {src.count.toLocaleString()} ({src.pct})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Discovery Question Matrix Shortcuts */}
          <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 shadow-ind-card">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-ind-blue" />
              9 Discovery Questions (Q1–Q9)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Filter the opportunity matrix by specific research focus:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9"].map((q) => (
                <Link
                  key={q}
                  href={`/themes?question=${q}`}
                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-ind-surface-2 hover:bg-ind-blue hover:text-white border border-slate-200 dark:border-ind-border-subtle text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
