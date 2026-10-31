import React from "react";

interface OpportunityScoreBarProps {
  frequency: number; // 0 to 1
  severity: number;  // 0 to 1
  actionability: number; // 0 to 1
  recency: number;   // 0 to 1
  showLabels?: boolean;
  className?: string;
}

export function OpportunityScoreBar({
  frequency,
  severity,
  actionability,
  recency,
  showLabels = true,
  className = ""
}: OpportunityScoreBarProps) {
  // Formula weights
  const wFreq = 0.30;
  const wSev = 0.30;
  const wAct = 0.25;
  const wRec = 0.15;

  const contribFreq = frequency * wFreq;
  const contribSev = severity * wSev;
  const contribAct = actionability * wAct;
  const contribRec = recency * wRec;
  const total = contribFreq + contribSev + contribAct + contribRec;

  const pctFreq = total > 0 ? (contribFreq / total) * 100 : 25;
  const pctSev = total > 0 ? (contribSev / total) * 100 : 25;
  const pctAct = total > 0 ? (contribAct / total) * 100 : 25;
  const pctRec = total > 0 ? (contribRec / total) * 100 : 25;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Visual Multi-Segment Bar */}
      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
        <div
          style={{ width: `${pctFreq}%` }}
          className="bg-ind-blue transition-all"
          title={`Frequency: ${(frequency * 100).toFixed(1)}% (Weight 30%)`}
        />
        <div
          style={{ width: `${pctSev}%` }}
          className="bg-ind-coral transition-all"
          title={`Severity: ${(severity * 100).toFixed(1)}% (Weight 30%)`}
        />
        <div
          style={{ width: `${pctAct}%` }}
          className="bg-ind-emerald transition-all"
          title={`Actionability: ${(actionability * 100).toFixed(1)}% (Weight 25%)`}
        />
        <div
          style={{ width: `${pctRec}%` }}
          className="bg-ind-warn transition-all"
          title={`Recency: ${(recency * 100).toFixed(1)}% (Weight 15%)`}
        />
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ind-blue" />
            <span>Freq {(frequency * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ind-coral" />
            <span>Sev {(severity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ind-emerald" />
            <span>Act {(actionability * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ind-warn" />
            <span>Rec {(recency * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
