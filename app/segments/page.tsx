export default function SegmentsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Segment Behavior View</h1>
      <p className="text-slate-400 text-sm mb-6">
        Compare drop-off friction across experience levels (first-timers vs seasoned investors) and age cohorts.
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        Segment comparisons will connect to /api/segments.
      </div>
    </main>
  );
}
