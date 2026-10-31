"use client";

import React from "react";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  options: FilterOption[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
  activeColor?: "blue" | "emerald";
}

export function FilterChips({
  options,
  selectedId,
  onChange,
  className = "",
  activeColor = "blue"
}: FilterChipsProps) {
  const getActiveClass = () => {
    if (activeColor === "emerald") {
      return "bg-ind-emerald text-white shadow-ind-emerald-glow";
    }
    return "bg-ind-blue text-white shadow-ind-glow";
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
              isSelected
                ? getActiveClass()
                : "bg-ind-surface-2 hover:bg-ind-surface-elevated text-slate-300 hover:text-white border border-ind-border-subtle"
            }`}
          >
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
