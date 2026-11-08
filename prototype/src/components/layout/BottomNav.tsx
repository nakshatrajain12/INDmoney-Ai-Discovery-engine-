'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, HelpCircle, FileText, Sliders } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { toggleDrawer } = useDemo();

  const links = [
    { label: 'SIPs', href: '/', icon: TrendingUp, exact: true },
    { label: 'Coach', href: '/coach', icon: HelpCircle, exact: false },
    { label: 'Ledger', href: '/ledger', icon: FileText, exact: false }
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-canvas/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-[430px] items-center justify-around px-2">
        {links.map(link => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center min-h-[44px] min-w-[56px] rounded-lg transition-colors py-1',
                isActive ? 'text-ind-blue font-bold' : 'text-t2 hover:text-t1 font-medium'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 tracking-tight">{link.label}</span>
            </Link>
          );
        })}

        {/* Demo Settings Button */}
        <button
          type="button"
          onClick={toggleDrawer}
          aria-label="Demo controls"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[56px] rounded-lg text-t2 hover:text-t1 font-medium py-1"
        >
          <Sliders className="h-5 w-5 text-ind-blue" aria-hidden="true" />
          <span className="text-[11px] mt-0.5 tracking-tight">Demo</span>
        </button>
      </div>
    </nav>
  );
}

