import React from "react";

interface SourceBadgeProps {
  source?: string;
  platform?: string;
  className?: string;
}

export function SourceBadge({ source = "google_play", platform, className = "" }: SourceBadgeProps) {
  const s = source.toLowerCase();

  if (s.includes("play") || s === "google_play") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Google Play {platform ? `(${platform})` : ""}
      </span>
    );
  }

  if (s.includes("apple") || s.includes("appstore") || s === "app_store") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        App Store
      </span>
    );
  }

  if (s.includes("youtube")) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        YouTube
      </span>
    );
  }

  if (s.includes("tradingqa") || s.includes("zerodha")) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        TradingQ&A
      </span>
    );
  }

  if (s.includes("valuepickr")) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        ValuePickr
      </span>
    );
  }

  if (s.includes("reddit")) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        Reddit
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {source}
    </span>
  );
}
