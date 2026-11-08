import React from "react";
import Link from "next/link";
import { ArrowRight, Database, Filter, Cpu, BarChart3, ShieldCheck, Terminal, BookOpen, Layers, Download, FileArchive } from "lucide-react";
import { ExportResearchButton } from "../components/ExportResearchButton";

export default function HowItWorksPage() {
  const stages = [
    {
      num: "01",
      title: "Multi-Source Ingestion & Schema Normalization",
      stat: "8,179 Raw Signals",
      desc: "Ingests raw investor discussions across Google Play Store (6,054), Apple App Store (922), YouTube (624), TradingQ&A (313), and ValuePickr (266). Standardizes each row to a unified schema with verified URLs, star ratings, and engagement metrics.",
      icon: Database,
      badge: "5 Distinct Sources"
    },
    {
      num: "02",
      title: "PII Sanitization & Relevance Gate",
      stat: "3,079 Clean Signals",
      desc: "Deduplicates posts at 0.85 fuzzy threshold. Sanitizes emails, phone numbers, and account identifiers using regex passes. Drops foreign language and generic 1-word spam ('good app'). Filters specifically for SIP & mutual fund retention relevance.",
      icon: Filter,
      badge: "62.4% Precision Filter"
    },
    {
      num: "03",
      title: "7-Dimensional LLM Extraction",
      stat: "7 Dimensions Extracted",
      desc: "Processes cleaned items through Groq LPU with multi-key parallel rotation. Extracts Discovery Questions (Q1–Q9), primary emotions & triggers, user segments, behavioral actions, friction points, temporal lifecycle signals, unmet needs, and verbatim quotes.",
      icon: Cpu,
      badge: "Median Conf > 0.75"
    },
    {
      num: "04",
      title: "Thematic Clustering & Opportunity Scoring",
      stat: "10 Ranked Themes",
      desc: "Aggregates extracted items into 10 cohesive themes. Computes weighted 4-factor Opportunity Scores (Frequency 30%, Severity 30%, Actionability 25%, Recency 15%). Generates tailored product interventions for INDmoney's retention moat.",
      icon: BarChart3,
      badge: "Mathematical Ranking"
    }
  ];

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-10">
      {/* Header Banner */}
      <section className="bg-white dark:bg-gradient-to-r dark:from-ind-surface-1 dark:to-ind-surface-2 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-8 shadow-ind-float">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ind-emerald animate-pulse" />
          <span className="text-[11px] font-bold text-ind-blue uppercase tracking-wider">
            ARCHITECTURE & METHODOLOGY
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald font-semibold border border-emerald-200 dark:border-ind-emerald/20">
            END-TO-END PIPELINE
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          How the Discovery Engine Works
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
          The AI Discovery Engine transforms noisy public investor feedback into prioritized, mathematically scored retention opportunities for INDmoney. Here is the complete stage-by-stage methodology.
        </p>
      </section>

      {/* 4-Stage Funnel Flow */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          <Layers size={20} className="text-ind-blue" />
          4-Stage Data Funnel
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle hover:border-ind-blue/40 rounded-ind-lg p-5 shadow-ind-card flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ind-blue tabular-nums">STAGE {st.num}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-ind-surface-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-ind-border-subtle">
                      {st.badge}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-ind-md bg-slate-100 dark:bg-ind-surface-2 flex items-center justify-center text-ind-emerald mb-3 border border-slate-200 dark:border-ind-border-subtle">
                    <Icon size={20} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{st.title}</h3>
                  <div className="text-xs font-bold text-ind-emerald tabular-nums mb-2.5">{st.stat}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mathematical Opportunity Score Deep-Dive */}
      <section className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-6 shadow-ind-card space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
          <BarChart3 size={18} className="text-ind-emerald" />
          The Mathematical Opportunity Scoring Formula
        </h2>
        
        <div className="bg-slate-100 dark:bg-ind-surface-2 p-4 rounded-ind-md border border-slate-200 dark:border-ind-border-subtle font-mono text-xs text-ind-emerald tabular-nums overflow-x-auto font-semibold">
          Opportunity Score = (0.30 × Frequency) + (0.30 × Severity) + (0.25 × Actionability) + (0.15 × Recency)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-3 bg-slate-100 dark:bg-ind-surface-2 rounded-ind-sm border border-slate-200 dark:border-ind-border-subtle/60">
            <span className="font-bold text-ind-blue block mb-1">Frequency (30%)</span>
            <span className="text-slate-600 dark:text-slate-300">Share of the corpus discussing this friction point, normalized against maximum theme frequency.</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-ind-surface-2 rounded-ind-sm border border-slate-200 dark:border-ind-border-subtle/60">
            <span className="font-bold text-ind-coral block mb-1">Severity (30%)</span>
            <span className="text-slate-600 dark:text-slate-300">Weighted average friction impact: Minor (0.33), Moderate (0.67), Critical churn trigger (1.00).</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-ind-surface-2 rounded-ind-sm border border-slate-200 dark:border-ind-border-subtle/60">
            <span className="font-bold text-ind-emerald block mb-1">Actionability (25%)</span>
            <span className="text-slate-600 dark:text-slate-300">Feasibility for INDmoney product and engineering teams to solve via UI, workflows, or educational nudges.</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-ind-surface-2 rounded-ind-sm border border-slate-200 dark:border-ind-border-subtle/60">
            <span className="font-bold text-ind-warn block mb-1">Recency (15%)</span>
            <span className="text-slate-600 dark:text-slate-300">Signal freshness: heavily weighted toward reviews within the past 12–24 months (2024–2026).</span>
          </div>
        </div>
      </section>

      {/* AI Prompt Transparency */}
      <section className="bg-white dark:bg-ind-surface-1 border border-slate-200 dark:border-ind-border-subtle rounded-ind-xl p-6 shadow-ind-card space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
          <Terminal size={18} className="text-ind-blue" />
          AI Prompt Transparency & Reproducibility
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All system prompts are version-controlled in the repository under <code>pipeline/prompts/</code>:
        </p>

        <div className="space-y-3">
          <details className="bg-slate-100 dark:bg-ind-surface-2 p-3.5 rounded-ind-md border border-slate-200 dark:border-ind-border-subtle text-xs cursor-pointer">
            <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>1. Master 7-Dimensional Extraction Prompt (<code>pipeline/prompts/master_extraction.txt</code>)</span>
              <span className="text-ind-blue text-[11px]">View Prompt Spec</span>
            </summary>
            <pre className="mt-3 p-3 bg-slate-950 rounded text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-slate-800">
{`Extracts 7 dimensions simultaneously:
1. Discovery Questions (Q1-Q9 mapping)
2. Emotion (primary, intensity, trigger)
3. User Segment (experience, age, income, influence source)
4. Behavioral Action (action taken, reason)
5. Friction Point (product area, specific issue, severity)
6. Temporal Signal (SIP tenure, market context)
7. Unmet Need & Verbatim Key Quote`}
            </pre>
          </details>

          <details className="bg-slate-100 dark:bg-ind-surface-2 p-3.5 rounded-ind-md border border-slate-200 dark:border-ind-border-subtle text-xs cursor-pointer">
            <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>2. RAG Synthesis & Citation Prompt (<code>pipeline/prompts/rag_synthesis.txt</code>)</span>
              <span className="text-ind-blue text-[11px]">View Prompt Spec</span>
            </summary>
            <pre className="mt-3 p-3 bg-slate-950 rounded text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-slate-800">
{`Grounds synthesized answers strictly in retrieved user quotes:
- Enforces [Source N] inline notation
- Disallows general investment advice
- Highlights segment differences and conflicting patterns
- Keeps answers focused and analytical (200-400 words)`}
            </pre>
          </details>
        </div>
      </section>

      {/* Complete Research Data Export Banner */}
      <section className="bg-gradient-to-r from-emerald-950/40 via-ind-surface-1 to-ind-surface-2 border border-emerald-500/30 rounded-ind-xl p-8 shadow-ind-float">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileArchive size={16} className="text-ind-emerald" />
              <span className="text-[11px] font-bold text-ind-emerald uppercase tracking-wider">
                Full Ground Truth Dataset Export
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Download the Complete Research & Discovery Engine Archive
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Export all underlying evidence used by the discovery engine: <code>segments.json</code> (all 10 segments), <code>themes.json</code> (10 opportunity themes), <code>hypotheses.json</code>, <code>evidence.csv</code> (3,079 rows), <code>survey_mapping.json</code>, <code>scoring_methodology.md</code>, and <code>source_summary.json</code>.
            </p>
          </div>

          <ExportResearchButton variant="primary" showDetails={false} className="shrink-0" />
        </div>
      </section>
    </main>
  );
}
