'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Bell, Sliders } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  eyebrow?: string;
  showBack?: boolean;
  backHref?: string;
  className?: string;
}

export function AppHeader({
  title = 'SIP Dashboard',
  eyebrow = 'SIP Steady',
  showBack = false,
  backHref,
  className
}: AppHeaderProps) {
  const router = useRouter();
  const { hideAmounts, toggleHideAmounts, toggleDrawer, inbox } = useDemo();
  const unreadCount = inbox.filter(m => !m.read).length;

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('sticky top-0 z-40 w-full', className)}>
      {/* Top Phone Status & Demo Notice */}
      <aside aria-label="Demo notice" className="bg-canvas border-b border-border/50">
        <div className="mx-auto flex max-w-[430px] items-center justify-between px-4 pt-2 text-[11px] font-semibold text-t2">
          <span>9:41</span>
          <span className="rounded-full bg-s2 px-2 py-0.5 text-[10px]">Demo Environment</span>
        </div>
        <div className="mx-auto max-w-[430px] px-4 py-1.5">
          <div className="flex items-center gap-1.5 rounded-full bg-ind-info-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ind-info-text">
            <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 animate-pulse" />
            <span className="truncate">Demo data · no real accounts or transactions</span>
          </div>
        </div>
      </aside>

      {/* Main Sticky Frosted Header */}
      <header className="border-b border-border bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[430px] items-center justify-between gap-2 px-3">
          {/* Left: Back button or Brand Wordmark */}
          <div className="flex items-center gap-2 min-w-0">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-s1 text-t1 hover:bg-s2 focus-visible:outline-2 focus-visible:outline-focus"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex h-11 items-center px-1 font-extrabold text-base tracking-tight text-ind-blue hover:opacity-80"
                aria-label="INDmoney Home"
              >
                IND
              </Link>
            )}

            {/* Title & Eyebrow */}
            <div className="truncate">
              {eyebrow && (
                <span className="block text-[10px] font-bold uppercase tracking-[0.06em] text-ind-emerald-text truncate">
                  {eyebrow}
                </span>
              )}
              <h1 className="text-base font-bold tracking-tight text-t1 truncate leading-tight">
                {title}
              </h1>
            </div>
          </div>

          {/* Right Action Controls: All touch targets >= 44x44px */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Eye Privacy Mask Button */}
            <button
              type="button"
              onClick={toggleHideAmounts}
              aria-label={hideAmounts ? 'Show monetary amounts' : 'Hide monetary amounts'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-s1 text-t1 hover:bg-s2 focus-visible:outline-2 focus-visible:outline-focus"
            >
              {hideAmounts ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            {/* Theme Toggle (Sun/Moon) */}
            <ThemeToggle />

            {/* Inbox / Messages Link */}
            <Link
              href="/inbox"
              aria-label={`Inbox${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-s1 text-t1 hover:bg-s2 focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ind-blue px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Demo Drawer Trigger Button */}
            <button
              type="button"
              onClick={toggleDrawer}
              aria-label="Open Demo Settings & Personas"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-s1 text-t1 hover:bg-s2 focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Sliders className="h-5 w-5 text-ind-blue" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

