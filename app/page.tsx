import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Signature INDmoney Net Worth Hero Card */}
      <section className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-ind-border-subtle rounded-ind-xl p-8 mb-8 shadow-ind-float relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-ind-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                TOTAL SIGNALS ANALYZED
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ind-emerald-subtle text-ind-emerald border border-ind-emerald/20">
                ● LIVE CORPUS
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-white tabular-nums">
                8,179
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-ind-emerald-subtle text-ind-emerald border border-ind-emerald/30">
                ↑ +100% Ingested
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-3 max-w-xl">
              Real-world investor feedback across Google Play, Apple App Store, YouTube, TradingQ&A, and ValuePickr targeting INDmoney SIP retention.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-3 justify-center">
            <Link
              href="/themes"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-ind-blue hover:bg-ind-blue-hover text-white text-sm font-semibold rounded-ind-md transition shadow-ind-glow"
            >
              Explore Top Themes →
            </Link>
            <Link
              href="/ask"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-ind-surface-2 hover:bg-ind-surface-elevated text-slate-200 text-sm font-semibold rounded-ind-md border border-ind-border-subtle transition"
            >
              Ask Discovery Copilot
            </Link>
          </div>
        </div>

        {/* Bottom Hero Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block">Critical Drop-off Window</span>
            <span className="text-ind-warn font-semibold text-sm tabular-nums mt-0.5 block">
              Months 3–6
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Primary Emotion Trigger</span>
            <span className="text-ind-coral font-semibold text-sm mt-0.5 block">
              Red Portfolio Panic
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Top Opportunity Score</span>
            <span className="text-ind-emerald font-semibold text-sm tabular-nums mt-0.5 block">
              0.87 / 1.00
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Golden Set Benchmark</span>
            <span className="text-ind-blue font-semibold text-sm tabular-nums mt-0.5 block">
              20 Hand-Labeled
            </span>
          </div>
        </div>
      </section>

      {/* Asymmetric 2-Column Desktop Grid (65% Main / 35% Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Main Column (8 cols = ~65%) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Top Ranked Retention Themes
            </h2>
            <Link href="/themes" className="text-xs text-ind-blue hover:underline font-semibold">
              View All 9 Themes →
            </Link>
          </div>

          {/* Theme Card #1 */}
          <div className="bg-ind-surface-1 border border-ind-border-subtle hover:border-ind-blue/40 rounded-ind-lg p-6 transition shadow-ind-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ind-emerald-subtle text-ind-emerald border border-ind-emerald/20">
                    #1 Opportunity
                  </span>
                  <span className="text-xs text-slate-400">Q3 · Drop-off Cause</span>
                </div>
                <h3 className="text-base font-bold text-white mt-2">
                  Red Portfolio Panic & Expectation Gap
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Opportunity Score</div>
                <div className="text-xl font-bold text-ind-emerald tabular-nums">0.87</div>
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-3">
              First-time SIP investors see negative NAV during months 1–6 and panic-cancel, lacking annualized context on market volatility.
            </p>

            <div className="mt-4 p-3 bg-ind-surface-2 rounded-ind-sm border-l-2 border-ind-emerald text-xs text-slate-300 italic">
              "Invested in Nifty 50 SIP for 4 months, now portfolio is showing -3%. INDmoney app only shows red, feels like I am losing money daily."
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-ind-border-subtle">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-ind-surface-2 text-slate-300">
                Segment: First-timer
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-ind-coral-subtle text-ind-coral">
                Emotion: Anxious (High)
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-ind-warn-subtle text-ind-warn">
                Tenure: Months 3–6
              </span>
            </div>
          </div>

          {/* Theme Card #2 */}
          <div className="bg-ind-surface-1 border border-ind-border-subtle hover:border-ind-blue/40 rounded-ind-lg p-6 transition shadow-ind-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ind-blue-soft text-ind-blue border border-ind-blue/20">
                    #2 Opportunity
                  </span>
                  <span className="text-xs text-slate-400">Q5 · App Friction</span>
                </div>
                <h3 className="text-base font-bold text-white mt-2">
                  Bank Mandate Expiry & Silent Auto-Debit Drop-Off
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Opportunity Score</div>
                <div className="text-xl font-bold text-ind-blue tabular-nums">0.79</div>
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-3">
              Silent bank e-mandate failures trigger auto-cancellation without transparent notification, leaving users unaware why their SIP stopped.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-ind-border-subtle">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-ind-surface-2 text-slate-300">
                Area: Mandate Payment
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-ind-warn-subtle text-ind-warn">
                Emotion: Frustrated
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-ind-surface-2 text-slate-300">
                Action: Paused / Stopped
              </span>
            </div>
          </div>
        </div>

        {/* Right Sticky Rail (4 cols = ~35%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ask Discovery Copilot Mini Widget */}
          <div className="bg-ind-surface-1 border border-ind-border-subtle rounded-ind-lg p-6 shadow-ind-card">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-ind-blue">✦</span> Ask the Discovery Engine
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Natural language RAG synthesis grounded in 6,247 verifiable investor quotes.
            </p>
            <div className="mt-4">
              <input
                type="text"
                placeholder="e.g. Why do users pause SIPs?"
                className="w-full bg-ind-surface-2 border border-ind-border-subtle focus:border-ind-blue focus:ring-1 focus:ring-ind-blue rounded-ind-sm px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[10px] bg-ind-surface-2 hover:bg-ind-surface-elevated text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer transition">
                Red portfolio panic
              </span>
              <span className="text-[10px] bg-ind-surface-2 hover:bg-ind-surface-elevated text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer transition">
                Mandate failures
              </span>
              <span className="text-[10px] bg-ind-surface-2 hover:bg-ind-surface-elevated text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer transition">
                Month 3-6 drop-off
              </span>
            </div>
          </div>

          {/* Source Breakdown Card */}
          <div className="bg-ind-surface-1 border border-ind-border-subtle rounded-ind-lg p-6 shadow-ind-card">
            <h3 className="text-sm font-bold text-white">Source Distribution</h3>
            <div className="space-y-3 mt-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Google Play (INDmoney, Groww, Coin)</span>
                  <span className="font-semibold tabular-nums">6,054 (74.0%)</span>
                </div>
                <div className="w-full bg-ind-surface-2 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ind-emerald h-full rounded-full" style={{ width: "74%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Apple App Store (INDmoney, Groww)</span>
                  <span className="font-semibold tabular-nums">922 (11.3%)</span>
                </div>
                <div className="w-full bg-ind-surface-2 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ind-blue h-full rounded-full" style={{ width: "11.3%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>YouTube Explainer Comments</span>
                  <span className="font-semibold tabular-nums">624 (7.6%)</span>
                </div>
                <div className="w-full bg-ind-surface-2 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ind-coral h-full rounded-full" style={{ width: "7.6%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>TradingQ&A + ValuePickr Forums</span>
                  <span className="font-semibold tabular-nums">579 (7.1%)</span>
                </div>
                <div className="w-full bg-ind-surface-2 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ind-warn h-full rounded-full" style={{ width: "7.1%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-ind-surface-1 border border-ind-border-subtle rounded-ind-lg p-5 text-xs text-slate-400 space-y-2">
            <div className="text-white font-semibold mb-2">Project Navigation</div>
            <div>
              <Link href="/themes" className="hover:text-ind-blue flex items-center justify-between">
                <span>Theme Explorer & Matrix</span>
                <span>→</span>
              </Link>
            </div>
            <div>
              <Link href="/segments" className="hover:text-ind-blue flex items-center justify-between">
                <span>Segment Comparison View</span>
                <span>→</span>
              </Link>
            </div>
            <div>
              <Link href="/evidence" className="hover:text-ind-blue flex items-center justify-between">
                <span>Golden Set & Evidence Log</span>
                <span>→</span>
              </Link>
            </div>
            <div>
              <Link href="/how-it-works" className="hover:text-ind-blue flex items-center justify-between">
                <span>Architecture & Data Funnel</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
