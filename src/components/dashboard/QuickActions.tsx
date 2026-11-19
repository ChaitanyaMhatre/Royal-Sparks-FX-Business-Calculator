'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  CreditCard,
  Receipt,
  CalendarDays,
  FileBarChart,
  DollarSign,
} from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'Add Event',
      href: '/events/new',
      icon: PlusCircle,
      accent: 'from-gold-600 to-gold-400 text-black',
      isPrimary: true,
    },
    {
      title: 'Record Payment',
      href: '/payments',
      icon: CreditCard,
      accent: 'from-emerald-600/30 to-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    },
    {
      title: 'Add Expense',
      href: '/expenses',
      icon: Receipt,
      accent: 'from-rose-600/30 to-rose-500/10 text-rose-300 border border-rose-500/30',
    },
    {
      title: 'Calendar',
      href: '/calendar',
      icon: CalendarDays,
      accent: 'from-blue-600/30 to-blue-500/10 text-blue-300 border border-blue-500/30',
    },
    {
      title: 'Cash Ledger',
      href: '/cash',
      icon: DollarSign,
      accent: 'from-amber-600/30 to-amber-500/10 text-amber-300 border border-amber-500/30',
    },
    {
      title: 'Reports & P&L',
      href: '/reports',
      icon: FileBarChart,
      accent: 'from-purple-600/30 to-purple-500/10 text-purple-300 border border-purple-500/30',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Quick Actions
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 ${
                act.isPrimary
                  ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black shadow-gold'
                  : `bg-gradient-to-br ${act.accent} hover:bg-surface-elevated`
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{act.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
