interface ThemeDrillDownProps {
  params: { id: string };
}

export default function ThemeDrillDownPage({ params }: ThemeDrillDownProps) {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Theme Evidence Drill-Down: {params.id}</h1>
      <p className="text-slate-400 text-sm mb-6">
        Detailed verbatim quotes, emotion distributions, and segment breakdowns for this opportunity area.
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        Drill-down evidence will be rendered dynamically from data/themes/themes.json.
      </div>
    </main>
  );
}
