'use client';

import React from 'react';
import { DashboardStats } from '@/types';
import { formatINR } from '@/lib/formatters';
import {
  CalendarDays,
  TrendingUp,
  Receipt,
  PiggyBank,
  CheckCircle2,
  Clock,
  Wallet,
  AlertCircle,
} from 'lucide-react';

interface FinancialSummaryCardsProps {
  stats: DashboardStats;
}

export default function FinancialSummaryCards({ stats }: FinancialSummaryCardsProps) {
  const cards = [
    {
      id: 'overall-profit',
      title: 'Overall Profit',
      value: formatINR(stats.overallProfit),
      subtitle: `Revenue ${formatINR(stats.totalRevenue)} - Exp ${formatINR(stats.totalExpenses)}`,
      icon: PiggyBank,
      trend: stats.overallProfit >= 0 ? '+Net Positive' : 'Loss',
      color: 'text-profit',
      bgColor: 'bg-profit-bg',
      borderColor: 'border-profit/30',
      badgeColor: 'bg-profit/20 text-profit',
      isHero: true,
    },
    {
      id: 'cash-balance',
      title: 'Available Cash Balance',
      value: formatINR(stats.availableCash),
      subtitle: `Opening ${formatINR(stats.openingCashBalance)} + Receipts - Paid Exp`,
      icon: Wallet,
      trend: 'Business Liquid Cash',
      color: 'text-gold-300',
      bgColor: 'bg-gold-500/10',
      borderColor: 'border-gold-500/40',
      badgeColor: 'bg-gold-500/20 text-gold-300',
      isHero: true,
    },
    {
      id: 'total-events',
      title: 'Total Events',
      value: stats.totalEvents.toString(),
      subtitle: `${stats.completedEvents} Done · ${stats.upcomingEvents} Upcoming`,
      icon: CalendarDays,
      trend: `${stats.upcomingEvents} Scheduled`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      badgeColor: 'bg-blue-500/20 text-blue-300',
    },
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: formatINR(stats.totalRevenue),
      subtitle: 'Total billed to clients',
      icon: TrendingUp,
      trend: 'Client Charges',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'total-expenses',
      title: 'Total Expenses',
      value: formatINR(stats.totalExpenses),
      subtitle: `Materials ${formatINR(stats.totalMaterialExpenses)} + Direct ${formatINR(stats.totalAdditionalExpenses)}`,
      icon: Receipt,
      trend: 'Combined Costs',
      color: 'text-expense',
      bgColor: 'bg-expense-bg',
      borderColor: 'border-expense/30',
      badgeColor: 'bg-expense/20 text-expense',
    },
    {
      id: 'amount-received',
      title: 'Amount Received',
      value: formatINR(stats.totalReceived),
      subtitle: 'Actual client collections',
      icon: CheckCircle2,
      trend: 'Collected In Bank/Cash',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'pending-payments',
      title: 'Pending Payments',
      value: formatINR(stats.pendingPayments),
      subtitle: 'Outstanding from clients',
      icon: Clock,
      trend: 'Awaiting Collection',
      color: 'text-royalOrange',
      bgColor: 'bg-pending-bg',
      borderColor: 'border-pending/30',
      badgeColor: 'bg-royalOrange/20 text-royalOrange',
    },
    {
      id: 'unpaid-expenses',
      title: 'Unpaid Expenses',
      value: formatINR(stats.unpaidExpenses),
      subtitle: 'Expenses due to be settled',
      icon: AlertCircle,
      trend: 'Payables Due',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      badgeColor: 'bg-rose-500/20 text-rose-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`p-3.5 sm:p-5 rounded-2xl bg-surface-card border ${card.borderColor} flex flex-col justify-between transition-all hover:bg-surface-elevated ${
              card.isHero ? 'shadow-sm shadow-gold-500/5 ring-1 ring-gold-500/20' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] sm:text-xs font-medium text-neutral-400 line-clamp-1">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div>
              <div className={`text-base sm:text-2xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 line-clamp-1">
                {card.subtitle}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-surface-border/50 flex items-center justify-between">
              <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
