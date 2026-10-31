export default function HowItWorksPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">How It Works — System Architecture</h1>
      <p className="text-slate-400 text-sm mb-6">
        Walkthrough of the 5-stage AI Discovery pipeline from raw ingestion to golden-set validated insights.
      </p>
      <div className="space-y-4 text-sm text-slate-300">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold text-white">Stage 0: Multi-Source Ingestion</h2>
          <p className="text-slate-400 mt-1">Collecting 5,000+ signals from Play Store, App Store, Reddit, YouTube, and TradingQ&A.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold text-white">Stage 1: Deduplication & PII Scrubbing</h2>
          <p className="text-slate-400 mt-1">Fuzzy matching at 0.85 threshold, masking PAN, phone numbers, and emails.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold text-white">Stage 2: 7-Dimensional LLM Extraction</h2>
          <p className="text-slate-400 mt-1">Classifying emotions, user segments, friction points, actions, and temporal lifecycle signals.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold text-white">Stage 3: Clustering & Opportunity Scoring</h2>
          <p className="text-slate-400 mt-1">Multiplicative opportunity scoring across Frequency, Severity, Actionability, and Recency.</p>
        </div>
      </div>
    </main>
  );
}
