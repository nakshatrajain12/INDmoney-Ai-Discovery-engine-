"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AskTheEngine } from "../components/AskTheEngine";
import { Sparkles, ShieldCheck, Database, Search } from "lucide-react";

function AskContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Copilot Header Banner */}
      <section className="bg-white dark:bg-gradient-to-r dark:from-ind-surface-1 dark:to-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-8 shadow-ind-float">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ind-emerald animate-pulse" />
          <span className="text-[11px] font-bold text-ind-blue uppercase tracking-wider">
            RAG SEMANTIC SYNTHESIS COPILOT
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald font-semibold border border-emerald-200 dark:border-ind-emerald/20">
            ● 3,079 EXTRACTED SIGNALS GROUNDED
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Ask the Discovery Engine
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Ask any question about why Indian investors drop off, pause, or cancel their mutual fund SIPs. The AI engine searches the underlying corpus of 3,079 cleaned user reviews and synthesizes an analytical answer with inline verbatim citations.
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-ind-border-subtle text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database size={13} className="text-ind-blue" />
            <span>5 Normalized Platforms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-ind-emerald" />
            <span>Zero Hallucinations (Strict Citation Guardrails)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Search size={13} className="text-ind-warn" />
            <span>Multi-Factor Semantic Ranking</span>
          </div>
        </div>
      </section>

      {/* Interactive Engine Search Component */}
      <AskTheEngine initialQuery={q} autoFocus={true} />
    </main>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Discovery Copilot...</div>}>
      <AskContent />
    </Suspense>
  );
}
