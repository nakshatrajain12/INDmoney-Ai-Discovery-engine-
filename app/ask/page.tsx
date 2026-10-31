export default function AskPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Ask the Discovery Engine</h1>
      <p className="text-slate-400 text-sm mb-6">
        Query the entire multi-source investor corpus. Every answer is synthesized with verifiable verbatim citations.
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <input
          type="text"
          placeholder="e.g. Why do first-time users cancel their SIP in months 3-6?"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          disabled
        />
        <div className="text-xs text-slate-500 mt-2">
          RAG interface connects to /api/query powered by ChromaDB & LLM synthesis in Stage 4.
        </div>
      </div>
    </main>
  );
}
