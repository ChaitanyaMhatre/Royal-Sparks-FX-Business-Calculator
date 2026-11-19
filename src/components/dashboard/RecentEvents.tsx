'use client';

import React from 'react';
import Link from 'next/link';
import { BusinessEvent } from '@/types';
import { formatINR, formatDate } from '@/lib/formatters';
import { calculateEventFinances } from '@/lib/calculations';
import {
  Calendar,
  MapPin,
  ArrowRight,
  TrendingUp,
  Receipt,
  User,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface RecentEventsProps {
  events: BusinessEvent[];
}

export default function RecentEvents({ events }: RecentEventsProps) {
  const recentEvents = [...events].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()).slice(0, 5);

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide">
            Recent Event Productions
          </h3>
          <p className="text-[11px] text-neutral-400">Latest fireworks & SFX bookings</p>
        </div>
        <Link
          href="/events"
          className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
        >
          <span>View All ({events.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentEvents.map((evt) => {
          const fin = calculateEventFinances(evt);
          const isFullyPaid = fin.pendingPayment <= 0 && fin.clientCharge > 0;

          return (
            <Link
              key={evt.id}
              href={`/events/${evt.id}`}
              className="block p-3.5 sm:p-4 rounded-xl bg-surface-elevated/70 border border-surface-border hover:border-gold-500/40 transition-all hover:bg-surface-elevated group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-surface-border/50">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      evt.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : evt.status === 'cancelled'
                        ? 'bg-neutral-800 text-neutral-400'
                        : 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                    }`}
                  >
                    {evt.status}
                  </span>
                  <h4 className="font-semibold text-sm text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                    {evt.event_name}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gold-400" />
                    <span>{formatDate(evt.event_date)}</span>
                  </div>
                  {evt.client_name && (
                    <div className="flex items-center gap-1 line-clamp-1">
                      <User className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{evt.client_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial metrics breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Client Charge</span>
                  <span className="font-semibold text-white">{formatINR(fin.clientCharge)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Total Expenses</span>
                  <span className="font-semibold text-expense">{formatINR(fin.totalExpenses)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Expected Profit</span>
                  <span className={`font-semibold ${fin.expectedProfit >= 0 ? 'text-profit' : 'text-expense'}`}>
                    {formatINR(fin.expectedProfit)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Payment Status</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isFullyPaid ? 'text-emerald-400' : 'text-royalOrange'
                    }`}
                  >
                    {isFullyPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Paid Full
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Due {formatINR(fin.pendingPayment)}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
