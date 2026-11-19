'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calculator, Calendar } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isDashboard = pathname === '/';
  const isCalculation = pathname.startsWith('/calculation') || pathname.startsWith('/calculate') || pathname.startsWith('/events');
  const isCalendar = pathname.startsWith('/calendar');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-elevated/95 backdrop-blur-lg border-t border-surface-border px-3 py-1.5 safe-area-pb"
    >
      <div className="grid grid-cols-3 items-center justify-around max-w-md mx-auto h-14">
        {/* 1. Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-2 rounded-xl transition-colors ${
            isDashboard
              ? 'text-gold-400 font-bold bg-gold-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-tight">Dashboard</span>
        </Link>

        {/* 2. Calculation */}
        <Link
          href="/calculation"
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-2 rounded-xl transition-colors ${
            isCalculation
              ? 'text-gold-400 font-bold bg-gold-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calculator className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-tight">Calculation</span>
        </Link>

        {/* 3. Calendar */}
        <Link
          href="/calendar"
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-2 rounded-xl transition-colors ${
            isCalendar
              ? 'text-gold-400 font-bold bg-gold-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-tight">Calendar</span>
        </Link>
      </div>
    </nav>
  );
}
