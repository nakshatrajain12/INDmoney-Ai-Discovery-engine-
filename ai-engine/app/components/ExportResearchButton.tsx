"use client";

import React, { useState } from "react";
import { Download, CheckCircle2, FileArchive, Loader2 } from "lucide-react";

interface ExportButtonProps {
  variant?: "primary" | "navbar" | "compact" | "card";
  className?: string;
  showDetails?: boolean;
}

export function ExportResearchButton({
  variant = "primary",
  className = "",
  showDetails = false,
}: ExportButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Directly trigger file download via link
      const link = document.createElement("a");
      link.href = "/api/export-research";
      link.download = "indmoney-research-data.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  if (variant === "navbar") {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        title="Download complete research data ZIP (All 10 segments, 10 themes, 3,079 evidence rows, hypotheses, survey mapping)"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-ind-md border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-sm transition ${className}`}
      >
        {downloading ? (
          <Loader2 size={13} className="animate-spin text-emerald-600 dark:text-emerald-400" />
        ) : downloaded ? (
          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Download size={13} className="text-emerald-600 dark:text-emerald-400" />
        )}
        <span className="hidden sm:inline">Export Research</span>
        <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 font-mono hidden md:inline">
          ZIP
        </span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-ind-md bg-ind-emerald hover:bg-emerald-600 text-white text-xs font-semibold shadow-ind-glow transition ${className}`}
      >
        {downloading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : downloaded ? (
          <CheckCircle2 size={14} />
        ) : (
          <Download size={14} />
        )}
        <span>{downloaded ? "Downloaded!" : "Export Research Data"}</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-4 rounded-xl border border-slate-200 dark:border-ind-border-subtle bg-white dark:bg-ind-surface-1 shadow-sm ${className}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-ind-emerald">
              <FileArchive size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Research Data Package
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All 10 segments, 10 themes, 3,079 evidence rows, hypotheses & survey mapping
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-ind-emerald hover:bg-emerald-600 text-white text-xs font-bold shadow-ind-glow transition shrink-0"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : downloaded ? (
              <CheckCircle2 size={14} />
            ) : (
              <Download size={14} />
            )}
            <span>{downloaded ? "Downloaded ZIP" : "Export Research Data"}</span>
          </button>
        </div>
      </div>
    );
  }

  // Default Primary Variant
  return (
    <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-ind-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition active:scale-[0.98]"
      >
        {downloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : downloaded ? (
          <CheckCircle2 size={16} />
        ) : (
          <Download size={16} />
        )}
        <span>{downloaded ? "Archive Downloaded!" : "Export Research Data"}</span>
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/40 border border-emerald-400/30 text-emerald-100">
          ZIP · 0.44 MB
        </span>
      </button>

      {showDetails && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 pl-0.5">
          Includes segments.json, themes.json, hypotheses.json, evidence.csv (3,079 rows), survey_mapping.json & scoring_methodology.md
        </span>
      )}
    </div>
  );
}

