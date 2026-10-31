export default function ThemesPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Theme Explorer & Opportunity Matrix</h1>
      <p className="text-slate-400 text-sm mb-6">
        Ranked themes discovered from user drop-off signals, scored by Frequency, Severity, Actionability, and Recency.
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
        Themes will populate upon execution of Stage 3 Clustering.
      </div>
    </main>
  );
}
