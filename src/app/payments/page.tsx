'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '@/lib/store';
import { formatINR, formatDate } from '@/lib/formatters';
import { calculateEventFinances } from '@/lib/calculations';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const { events, recordPayment, stats, currentUser } = useBusinessStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State for new payment
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [amount, setAmount] = useState<number>(10000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'upi' | 'cash' | 'other'>('bank_transfer');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Collect all payments across all events
  const allPayments = useMemo(() => {
    const list: Array<{
      id: string;
      eventId: string;
      eventName: string;
      clientName: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      ref?: string;
      notes?: string;
      createdByName?: string;
    }> = [];

    events.forEach((evt) => {
      (evt.payments || []).forEach((pmt) => {
        list.push({
          id: pmt.id,
          eventId: evt.id,
          eventName: evt.event_name,
          clientName: evt.client_name,
          amount: Number(pmt.amount),
          paymentDate: pmt.payment_date,
          paymentMethod: pmt.payment_method,
          ref: pmt.transaction_reference,
          notes: pmt.notes,
        });
      });
    });

    return list.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [events]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return allPayments;
    const q = searchQuery.toLowerCase();
    return allPayments.filter(
      (p) =>
        p.eventName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        (p.ref && p.ref.toLowerCase().includes(q))
    );
  }, [allPayments, searchQuery]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }
    if (amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    const res = await recordPayment({
      event_id: selectedEventId,
      amount: Number(amount),
      payment_date: paymentDate,
      payment_method: paymentMethod,
      transaction_reference: refNumber,
      notes: notes,
    });

    if (res.success) {
      toast.success('Payment recorded successfully! Centralized cash balance updated.');
      setShowModal(false);
      setNotes('');
      setRefNumber('');
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Payment Receipts & Collections
          </h1>
          <p className="text-xs text-neutral-400">
            Record full & partial client collections, UPI transactions & settlements
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black shadow-gold hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Client Payment</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-card border border-emerald-500/30">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Total Collections Received
          </span>
          <span className="text-lg sm:text-2xl font-black text-emerald-400">
            {formatINR(stats.totalReceived)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">Deposited into cash & bank</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-pending/30">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Pending Client Dues
          </span>
          <span className="text-lg sm:text-2xl font-black text-royalOrange">
            {formatINR(stats.pendingPayments)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">Receivables to collect</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-gold-500/30">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Current Cash Available
          </span>
          <span className="text-lg sm:text-2xl font-black text-gold-300">
            {formatINR(stats.availableCash)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">Liquid business capital</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
            Receipts Logged
          </span>
          <span className="text-lg sm:text-2xl font-black text-white">
            {allPayments.length} Transactions
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">Audit tracked entries</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 sm:p-4 rounded-2xl bg-surface-card border border-surface-border">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by event name, client or reference..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="overflow-hidden rounded-2xl bg-surface-card border border-surface-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-elevated/50 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Event & Client</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference / Details</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredPayments.map((pmt) => (
                <tr key={pmt.id} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-300 font-medium">
                    {formatDate(pmt.paymentDate)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/events/${pmt.eventId}`}
                      className="font-bold text-white hover:text-gold-300 transition-colors block"
                    >
                      {pmt.eventName}
                    </Link>
                    <span className="text-[11px] text-neutral-400">{pmt.clientName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-surface border border-surface-border text-gold-300">
                      {pmt.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-neutral-200 block text-[11px]">
                      {pmt.ref || 'No Ref'}
                    </span>
                    {pmt.notes && <span className="text-[10px] text-neutral-400">{pmt.notes}</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                    {formatINR(pmt.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/events/${pmt.eventId}`}
                      className="text-xs text-neutral-400 hover:text-gold-300 underline"
                    >
                      View Event
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleRecordSubmit}
            className="w-full max-w-lg bg-surface-elevated border border-gold-500/40 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-400" />
                <h3 className="text-base font-bold text-white font-serif">Record Client Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Select Associated Event <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                >
                  {events.map((e) => {
                    const fin = calculateEventFinances(e);
                    return (
                      <option key={e.id} value={e.id}>
                        {e.event_name} (Pending: {formatINR(fin.pendingPayment)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Amount Received (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-surface-border text-white text-sm font-bold text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS/RTGS)</option>
                    <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Transaction Reference / UTR / UPI ID
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. UTR-281048204 or UPI-9821034"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 50% advance or full settlement"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-surface text-neutral-300 hover:bg-surface-card"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-gold"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
