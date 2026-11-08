'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SparklinePoint {
  label: string; // e.g. "Jun", "Jul", "Now"
  nav: number; // in rupees, e.g. 68.20
  unitsBought?: number;
}

interface AccumulationSparklineProps {
  points: SparklinePoint[];
  avgNav: number;
  currentNav: number;
  totalUnits: number;
  className?: string;
}

export function AccumulationSparkline({
  points,
  avgNav,
  currentNav,
  totalUnits,
  className
}: AccumulationSparklineProps) {
  if (points.length < 2) {
    return (
      <div className={cn('rounded-xl border border-border bg-s2 p-3 text-xs text-t2', className)}>
        Accumulation trend available after multiple instalments.
      </div>
    );
  }

  const width = 320;
  const height = 120;
  const paddingX = 24;
  const paddingY = 20;

  const navs = points.map(p => p.nav);
  const minNav = Math.min(...navs, avgNav) * 0.98;
  const maxNav = Math.max(...navs, avgNav) * 1.02;
  const navRange = maxNav - minNav || 1;

  const getX = (index: number) => {
    return paddingX + (index / (points.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minNav) / navRange) * (height - 2 * paddingY);
  };

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.nav).toFixed(1)}`)
    .join(' ');

  const avgNavY = getY(avgNav);

  return (
    <div className={cn('rounded-2xl border border-border bg-s1 p-4 shadow-ind-card', className)}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-t2">
            Unit Accumulation & NAV Trend
          </span>
          <div className="text-sm font-bold text-t1 mt-0.5">
            {totalUnits.toFixed(3)} units accumulated
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-t2">
            Current / Avg NAV
          </span>
          <div className="text-sm font-bold tabular-nums text-t1 mt-0.5">
            ₹{currentNav.toFixed(2)} / ₹{avgNav.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[140px] overflow-visible"
          role="img"
          aria-label={`NAV fluctuation line chart across ${points.length} periods. Average NAV is ₹${avgNav.toFixed(2)}.`}
        >
          {/* Average NAV Reference Line (dashed) */}
          <line
            x1={paddingX}
            y1={avgNavY}
            x2={width - paddingX}
            y2={avgNavY}
            stroke="var(--ind-text-muted)"
            strokeDasharray="3 3"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Area fill under curve */}
          <path
            d={`${pathD} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`}
            fill="var(--blue)"
            fillOpacity="0.08"
          />

          {/* Sparkline curve */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--blue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <g key={i}>
                <circle
                  cx={getX(i)}
                  cy={getY(p.nav)}
                  r={isLast ? 4 : 3}
                  className={isLast ? 'fill-ind-blue stroke-canvas stroke-2' : 'fill-ind-blue'}
                />
                <text
                  x={getX(i)}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-t2 text-[9px] font-semibold"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-t2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-ind-blue" />
          <span>Instalment NAV</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 border-t border-dashed border-t3" />
          <span>Average purchase price (₹{avgNav.toFixed(2)})</span>
        </div>
      </div>
    </div>
  );
}
