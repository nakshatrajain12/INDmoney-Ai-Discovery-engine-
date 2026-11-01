"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Search, BarChart3, HelpCircle, ShieldCheck, PieChart, Sparkles, Sun, Moon } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("ind_theme", "light");
      } catch (e) {}
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("ind_theme", "dark");
      } catch (e) {}
      setIsDark(true);
    }
  };

  const navItems = [
    { href: "/", label: "Overview", icon: Layers },
    { href: "/themes", label: "Themes", icon: BarChart3 },
    { href: "/segments", label: "Segments", icon: PieChart },
    { href: "/ask", label: "Copilot", icon: Search },
    { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
    { href: "/evidence", label: "Evidence Log", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B0E14]/90 backdrop-blur-md border-b border-slate-200 dark:border-ind-border-subtle transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-ind-md bg-gradient-to-tr from-ind-blue to-ind-emerald flex items-center justify-center font-bold text-white shadow-ind-glow text-sm">
            IND
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white group-hover:text-ind-blue transition">
              INDmoney <span className="text-ind-blue">Discovery Engine</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
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
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-ind-surface-2"
                }`}
              >
                <Icon size={13} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls: Live Corpus Pill, Theme Toggle Button & Copilot Shortcut */}
        <div className="flex items-center gap-2">
          {/* Live Corpus Counter Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-ind-emerald-subtle text-emerald-700 dark:text-ind-emerald border border-emerald-200 dark:border-ind-emerald/30 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-ind-emerald animate-pulse" />
            8,179 Raw · 3,079 Clean
          </span>

          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            id="theme-toggle-btn"
            title={isDark ? "Turn off dark mode (Switch to Light Mode)" : "Turn on dark mode (Switch to Dark Mode)"}
            aria-label={isDark ? "Turn off dark mode" : "Turn on dark mode"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-ind-md border border-slate-200 dark:border-ind-border-subtle bg-slate-100 dark:bg-ind-surface-2 hover:bg-slate-200 dark:hover:bg-ind-surface-elevated text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition shadow-sm"
          >
            {mounted && !isDark ? (
              <>
                <Moon size={14} className="text-ind-blue" />
                <span className="hidden lg:inline text-[11px]">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={14} className="text-amber-400" />
                <span className="hidden lg:inline text-[11px]">Light Mode</span>
              </>
            )}
          </button>

          {/* Ask Copilot Button */}
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
