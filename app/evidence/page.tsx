export default function EvidencePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Golden Set & Evidence Log</h1>
      <p className="text-slate-400 text-sm mb-6">
        Transparency layer benchmarking AI extraction accuracy against a hand-labeled golden set with documented human corrections.
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        Connects to docs/evidence_log.md and data/eval/eval_results.json.
      </div>
    </main>
  );
}
