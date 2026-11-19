'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '@/lib/store';
import { formatINR, formatDate } from '@/lib/formatters';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Boxes,
  Plus,
  ArrowRight,
  DollarSign,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExpensesManagementPage() {
  const { events, updateExpenseStatus, stats } = useBusinessStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'material' | 'additional'>('all');

  // Flatten all expenses and materials across all events
  const allExpenses = useMemo(() => {
    const list: Array<{
      id: string;
      eventId: string;
      eventName: string;
      expenseDate: string;
      title: string;
      category: string;
      type: 'material' | 'additional';
      amount: number;
      quantity?: number;
      unitPrice?: number;
      paymentStatus: 'paid' | 'unpaid';
      paymentMethod?: string;
    }> = [];

    events.forEach((evt) => {
      // Materials
      (evt.materials || []).forEach((mat) => {
        list.push({
          id: mat.id,
          eventId: evt.id,
          eventName: evt.event_name,
          expenseDate: evt.event_date,
          title: mat.material_name,
          category: 'SFX Material',
          type: 'material',
          amount: Number(mat.total_expense),
          quantity: Number(mat.quantity),
          unitPrice: Number(mat.unit_price),
          paymentStatus: 'paid', // Material stock is accounted for
          paymentMethod: 'stock',
        });
      });

      // Additional expenses
      (evt.expenses || []).forEach((exp) => {
        list.push({
          id: exp.id,
          eventId: evt.id,
          eventName: evt.event_name,
          expenseDate: exp.expense_date,
          title: exp.description || exp.category,
          category: exp.category,
          type: 'additional',
          amount: Number(exp.amount),
          paymentStatus: exp.payment_status,
          paymentMethod: exp.payment_method,
        });
      });
    });

    return list;
  }, [events]);

  // Filters & search
  const filteredList = useMemo(() => {
    return allExpenses.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.paymentStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.eventName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allExpenses, typeFilter, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Centralized Expense Hub
          </h1>
          <p className="text-xs text-neutral-400">
            Real-time tracking of SFX materials, haulage, technician wages & direct costs
          </p>
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-elevated border border-surface-border text-white"
        >
          <span>Select Event to Add Expenses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 5 Summary Cards Specified in Section 14 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Total Expenses
          </span>
          <span className="text-base sm:text-xl font-black text-expense">
            {formatINR(stats.totalExpenses)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">All events combined</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-emerald-500/20">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Paid Expenses
          </span>
          <span className="text-base sm:text-xl font-black text-emerald-400">
            {formatINR(stats.totalExpenses - stats.unpaidExpenses)}
          </span>
          <span className="text-[10px] text-emerald-500/80 block mt-0.5">Deducted from cash</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-rose-500/30">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Unpaid Expenses
          </span>
          <span className="text-base sm:text-xl font-black text-rose-400">
            {formatINR(stats.unpaidExpenses)}
          </span>
          <span className="text-[10px] text-rose-500/80 block mt-0.5">Pending settlements</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Material Expenses
          </span>
          <span className="text-base sm:text-xl font-black text-gold-300">
            {formatINR(stats.totalMaterialExpenses)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">Sparcular, Fanwheel etc.</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Additional Expenses
          </span>
          <span className="text-base sm:text-xl font-black text-white">
            {formatINR(stats.totalAdditionalExpenses)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">Labour, travel & misc</span>
        </div>
      </div>

      {/* Notice on Cash vs Profit Impact */}
      <div className="p-3.5 rounded-xl bg-surface-elevated border border-gold-500/30 flex items-start gap-3 text-xs">
        <Receipt className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <p className="text-neutral-300">
          <strong className="text-white">Royal Sparks FX Rule:</strong> Every recorded expense reduces expected event profit. However, only expenses marked <span className="text-emerald-400 font-bold">PAID</span> reduce the real-time business available cash balance.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, materials, or event..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            >
              <option value="all">All Types</option>
              <option value="material">Materials</option>
              <option value="additional">Additional Costs</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            >
              <option value="all">Paid & Unpaid</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="overflow-hidden rounded-2xl bg-surface-card border border-surface-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-elevated/50 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Expense / Material</th>
                <th className="py-3 px-4">Associated Event</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredList.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-300 font-medium">
                    {formatDate(item.expenseDate)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{item.title}</span>
                    {item.quantity && item.unitPrice && (
                      <span className="text-[10px] text-neutral-400">
                        {item.quantity} units @ {formatINR(item.unitPrice)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/events/${item.eventId}`}
                      className="text-gold-300 hover:underline font-medium"
                    >
                      {item.eventName}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface border border-surface-border text-neutral-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.paymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-expense">
                    {formatINR(item.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.type === 'additional' ? (
                      <button
                        onClick={async () => {
                          await updateExpenseStatus(
                            item.id,
                            item.eventId,
                            item.paymentStatus === 'paid' ? 'unpaid' : 'paid',
                            'upi'
                          );
                          toast.success(
                            item.paymentStatus === 'paid'
                              ? 'Expense marked as unpaid'
                              : 'Expense marked as paid & deducted from cash'
                          );
                        }}
                        className="px-2 py-1 rounded bg-surface border border-surface-border text-[10px] text-neutral-300 hover:text-white"
                      >
                        {item.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-500">Material Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
