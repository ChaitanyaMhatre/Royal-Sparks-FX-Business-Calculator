'use client';

import React from 'react';
import Link from 'next/link';
import { BusinessEvent } from '@/types';
import { calculateEventFinances } from '@/lib/calculations';
import { formatINR } from '@/lib/formatters';
import {
  AlertTriangle,
  Receipt,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface IncompleteRemindersProps {
  events: BusinessEvent[];
}

export default function IncompleteReminders({ events }: IncompleteRemindersProps) {
  const reminders: Array<{
    eventId: string;
    eventName: string;
    type: 'missing_expense' | 'zero_charge' | 'pending_payment' | 'unpaid_expenses';
    title: string;
    description: string;
    actionText: string;
    icon: any;
    color: string;
    badge: string;
  }> = [];

  events.forEach((evt) => {
    if (evt.status === 'cancelled') return;
    const fin = calculateEventFinances(evt);

    // 1. Missing materials & expenses
    const totalExpCount = (evt.materials?.length || 0) + (evt.expenses?.length || 0);
    if (totalExpCount === 0) {
      reminders.push({
        eventId: evt.id,
        eventName: evt.event_name,
        type: 'missing_expense',
        title: 'Missing Event Expenses',
        description: 'No material or additional expenses logged yet.',
        actionText: 'Add Expenses',
        icon: Receipt,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        badge: 'No Expenses',
      });
    }

    // 2. Events without client charge
    if (Number(evt.total_client_charge) <= 0) {
      reminders.push({
        eventId: evt.id,
        eventName: evt.event_name,
        type: 'zero_charge',
        title: 'Missing Client Charge',
        description: 'Client billing amount is currently ₹0.',
        actionText: 'Set Client Charge',
        icon: DollarSign,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: '₹0 Charge',
      });
    }

    // 3. Pending client payments
    if (fin.pendingPayment > 0) {
      reminders.push({
        eventId: evt.id,
        eventName: evt.event_name,
        type: 'pending_payment',
        title: `Pending Client Payment: ${formatINR(fin.pendingPayment)}`,
        description: `Collected ${formatINR(fin.totalReceived)} of ${formatINR(fin.clientCharge)}.`,
        actionText: 'Record Payment',
        icon: Clock,
        color: 'text-royalOrange bg-pending-bg border-pending/30',
        badge: `${formatINR(fin.pendingPayment)} Due`,
      });
    }

    // 4. Unpaid operational expenses
    if (fin.unpaidExpenses > 0) {
      reminders.push({
        eventId: evt.id,
        eventName: evt.event_name,
        type: 'unpaid_expenses',
        title: `Unpaid Vendor/Crew: ${formatINR(fin.unpaidExpenses)}`,
        description: 'Pending vendor, labour or transportation disbursements.',
        actionText: 'Settle Expense',
        icon: AlertTriangle,
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        badge: `${formatINR(fin.unpaidExpenses)} Unpaid`,
      });
    }
  });

  if (reminders.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-profit shrink-0" />
        <div className="text-xs">
          <span className="font-semibold text-white">All Event Records Complete: </span>
          <span className="text-neutral-400">
            No missing expenses, uncharged events, or overdue unsettled entries found.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-royalOrange" />
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Incomplete Entry Reminders ({reminders.length})
          </h3>
        </div>
        <span className="text-[10px] text-neutral-400">
          Any member can update & complete
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {reminders.slice(0, 4).map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.eventId}-${item.type}-${idx}`}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${item.color} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-black/40 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate max-w-[150px] sm:max-w-[200px]">
                      {item.eventName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/60">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 truncate">{item.description}</p>
                </div>
              </div>

              <Link
                href={`/events/${item.eventId}`}
                className="px-2.5 py-1.5 bg-black/60 hover:bg-black text-white text-[11px] font-medium rounded-lg shrink-0 flex items-center gap-1 border border-white/10"
              >
                <span>{item.actionText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
