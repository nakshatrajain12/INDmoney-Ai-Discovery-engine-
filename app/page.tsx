import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="border-b border-slate-800 pb-8 mb-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
              Phase 0 Skeleton Active
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-3">
              INDmoney SIP Retention — AI Discovery Engine
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              Uncovering hidden behavioral drop-offs, emotional triggers, and retention opportunities across 5,000+ investor data points.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/themes"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
            >
              Theme Explorer
            </Link>
            <Link
              href="/ask"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
            >
              Ask the Engine
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Total Ingested Data</div>
          <div className="text-2xl font-bold text-white mt-2">6,247</div>
          <div className="text-xs text-emerald-400 mt-1">Ready for Stage 1 filter</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Target Coverage</div>
          <div className="text-2xl font-bold text-white mt-2">≥ 5 Sources</div>
          <div className="text-xs text-slate-400 mt-1">Play Store, Reddit, App Store, YT, Forum</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Discovery Questions</div>
          <div className="text-2xl font-bold text-white mt-2">9 Dimensions</div>
          <div className="text-xs text-slate-400 mt-1">Lifecycle, drop-offs, friction</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Trust Layer</div>
          <div className="text-2xl font-bold text-white mt-2">Golden Set</div>
          <div className="text-xs text-emerald-400 mt-1">Audit log + corrections wired</div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white">Interactive Modules</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>
              <Link href="/themes" className="hover:text-emerald-400 font-medium">
                → Theme Explorer & Ranked Opportunity Matrix
              </Link>
            </li>
            <li>
              <Link href="/ask" className="hover:text-emerald-400 font-medium">
                → Ask the Engine (RAG Semantic Citations)
              </Link>
            </li>
            <li>
              <Link href="/segments" className="hover:text-emerald-400 font-medium">
                → Segment-Level Behavior Breakdown
              </Link>
            </li>
            <li>
              <Link href="/evidence" className="hover:text-emerald-400 font-medium">
                → Golden Set Benchmark & Documented AI Corrections
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white">System Status</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span>Phase 0 (Skeleton & Client)</span>
              <span className="text-emerald-400 font-medium">Completed</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span>Stage 0 Ingested Corpus</span>
              <span className="text-emerald-400 font-medium">6,247 rows ready</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span>Unified LLM Client</span>
              <span className="text-emerald-400 font-medium">Active (Groq / Claude ready)</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
