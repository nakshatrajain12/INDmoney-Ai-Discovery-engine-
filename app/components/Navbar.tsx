"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Search, BarChart3, HelpCircle, ShieldCheck, PieChart, Sparkles } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Overview", icon: Layers },
    { href: "/themes", label: "Themes", icon: BarChart3 },
    { href: "/segments", label: "Segments", icon: PieChart },
    { href: "/ask", label: "Copilot", icon: Search },
    { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
    { href: "/evidence", label: "Evidence Log", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md border-b border-ind-border-subtle">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-ind-md bg-gradient-to-tr from-ind-blue to-ind-emerald flex items-center justify-center font-bold text-white shadow-ind-glow text-sm">
            IND
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white group-hover:text-ind-blue transition">
              INDmoney <span className="text-ind-blue">Discovery Engine</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              SIP Retention & Behavioral Intelligence
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? "bg-ind-blue text-white shadow-ind-glow"
                    : "text-slate-300 hover:text-white hover:bg-ind-surface-2"
                }`}
              >
                <Icon size={13} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Live Corpus Pill & Copilot Shortcut */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ind-emerald-subtle text-ind-emerald border border-ind-emerald/30 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-ind-emerald animate-pulse" />
            8,179 Raw · 3,079 Clean
          </span>

          <Link
            href="/ask"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-ind-md bg-ind-blue hover:bg-ind-blue-hover text-white text-xs font-semibold shadow-ind-glow transition"
          >
            <Sparkles size={12} />
            <span className="hidden sm:inline">Ask Copilot</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
