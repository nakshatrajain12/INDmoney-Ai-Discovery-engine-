"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FilterChips } from "../components/FilterChips";
import { ArrowRight, BarChart3, Search, TrendingUp, Layers, Sparkles, Filter } from "lucide-react";
import { ThemeSummary } from "../components/ThemeCard";

const DISCOVERY_QUESTIONS = [
  { id: "ALL", label: "All Questions (Q1–Q9)" },
  { id: "Q1", label: "Q1: Start & Expectation" },
  { id: "Q2", label: "Q2: Behavioral Shift" },
  { id: "Q3", label: "Q3: Pause & Stop Causes" },
  { id: "Q4", label: "Q4: Check Frequency & NAV" },
  { id: "Q5", label: "Q5: In-App Friction" },
  { id: "Q6", label: "Q6: External Validation" },
  { id: "Q7", label: "Q7: Continuers vs Drop-offs" },
  { id: "Q8", label: "Q8: Segment Nuances" },
  { id: "Q9", label: "Q9: Unmet Needs" },
];

function ThemeExplorerContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("question") || "ALL";

  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState(initialQ);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "frequency" | "severity">("score");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThemes() {
      try {
        const res = await fetch("/api/themes?matrix=true");
        if (res.ok) {
          const data = await res.json();
          setThemes(data.themes || []);
        }
      } catch (e) {
        console.error("Failed to load themes", e);
      } finally {
        setLoading(false);
      }
    }
    loadThemes();
  }, []);

  // Filter & Sort
  const filteredThemes = themes
    .filter((t) => {
      // Question filter
      if (selectedQuestion !== "ALL" && !t.discovery_questions.includes(selectedQuestion)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.key_insight.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "frequency") return b.volume_percentage - a.volume_percentage;
      if (sortBy === "severity") return b.score_breakdown.severity - a.score_breakdown.severity;
      return b.opportunity_score - a.opportunity_score;
    });

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-ind-surface-1 dark:to-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-6 shadow-ind-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-ind-blue tracking-wider uppercase">
                OPPORTUNITY SCORING ENGINE
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald font-semibold border border-emerald-200 dark:border-ind-emerald/20">
                ● 10 THEMES VALIDATED
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Theme Explorer & Opportunity Matrix
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Ranked matrix prioritizing drop-off themes by formula: 30% Frequency + 30% Severity + 25% Actionability + 15% Recency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ask"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-ind-blue hover:bg-ind-blue-hover text-white text-xs font-semibold rounded-ind-md shadow-ind-glow transition"
            >
              <Sparkles size={13} />
              Query via Copilot
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-lg p-5 space-y-4 shadow-ind-card">
        {/* Q1-Q9 Pill Filter Chips */}
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Filter size={13} className="text-ind-blue" />
            Filter by Discovery Question (Q1–Q9):
          </div>
          <FilterChips
            options={DISCOVERY_QUESTIONS}
            selectedId={selectedQuestion}
            onChange={setSelectedQuestion}
            activeColor="blue"
          />
        </div>

        {/* Search input & Sort selector */}
        <div className="pt-3 border-t border-slate-200 dark:border-ind-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search theme, trigger, or keyword..."
              className="w-full bg-slate-50 dark:bg-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle rounded-ind-md pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ind-border-focus"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400">
            <span>Sort by:</span>
            <div className="flex rounded-ind-md bg-slate-100 dark:bg-ind-surface-2 p-0.5 border border-slate-200 dark:border-ind-border-subtle">
              <button
                onClick={() => setSortBy("score")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  sortBy === "score" ? "bg-ind-blue text-white shadow-ind-glow" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Opportunity Score
              </button>
              <button
                onClick={() => setSortBy("frequency")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  sortBy === "frequency" ? "bg-ind-blue text-white shadow-ind-glow" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Frequency %
              </button>
              <button
                onClick={() => setSortBy("severity")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  sortBy === "severity" ? "bg-ind-blue text-white shadow-ind-glow" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Severity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sortable Opportunity Matrix Table */}
      <div className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl overflow-hidden shadow-ind-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-ind-surface-2/80 border-b border-slate-200 dark:border-ind-border-subtle text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Theme Name & Insight</th>
                <th className="py-3 px-3 text-center">Questions</th>
                <th className="py-3 px-3 text-right">Opp. Score</th>
                <th className="py-3 px-3 text-right">Frequency</th>
                <th className="py-3 px-3 text-right">Severity</th>
                <th className="py-3 px-3 text-right">Actionability</th>
                <th className="py-3 px-4 text-center">Top Emotion</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-ind-border-subtle/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading Opportunity Matrix...
                  </td>
                </tr>
              ) : filteredThemes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No themes matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredThemes.map((theme) => {
                  const sb = theme.score_breakdown;
                  return (
                    <tr
                      key={theme.id}
                      className="hover:bg-slate-50 dark:hover:bg-ind-surface-2/50 transition cursor-pointer group"
                    >
                      <td className="py-4 px-4 text-center font-bold tabular-nums">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                            (theme.rank || 1) <= 3
                              ? "bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald border border-emerald-200 dark:border-ind-emerald/30 font-bold"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          #{theme.rank || 1}
                        </span>
                      </td>

                      <td className="py-4 px-4 max-w-md">
                        <Link href={`/themes/${theme.id}`} className="block">
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-ind-blue transition text-sm">
                            {theme.name}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {theme.key_insight}
                          </p>
                        </Link>
                      </td>

                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {theme.discovery_questions.map((q) => (
                            <span
                              key={q}
                              className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-ind-surface-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-ind-border-subtle"
                            >
                              {q}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-3 text-right tabular-nums font-bold text-ind-emerald text-sm">
                        {theme.opportunity_score.toFixed(3)}
                      </td>

                      <td className="py-4 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {theme.volume_percentage}%
                      </td>

                      <td className="py-4 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {sb.severity.toFixed(2)}
                      </td>

                      <td className="py-4 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {sb.actionability.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-ind-surface-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-ind-border-subtle">
                          {theme.top_emotion}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/themes/${theme.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 dark:bg-ind-surface-2 hover:bg-ind-blue hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition border border-slate-200 dark:border-transparent"
                        >
                          Drill Down
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default function ThemeExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Theme Explorer...</div>}>
      <ThemeExplorerContent />
    </Suspense>
  );
}
