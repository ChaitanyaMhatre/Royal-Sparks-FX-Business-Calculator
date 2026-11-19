'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '@/lib/store';
import { formatINR, formatDateTime } from '@/lib/formatters';
import {
  Wallet,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  History,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  DollarSign,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CashLedgerPage() {
  const {
    cashTransactions,
    openingBalance,
    updateOpeningBalance,
    recordCashAdjustment,
    stats,
    currentUser,
  } = useBusinessStore();

  // Adjustment Modal State
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjType, setAdjType] = useState<'cash_added' | 'cash_withdrawn' | 'correction'>('cash_added');
  const [adjAmount, setAdjAmount] = useState<number>(5000);
  const [adjDesc, setAdjDesc] = useState('');

  // Opening Balance Modal
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [newOpening, setNewOpening] = useState<number>(openingBalance);

  // Compute Running Balance for each Ledger Transaction
  const ledgerWithRunningBalance = useMemo(() => {
    // Sort chronological first
    const sorted = [...cashTransactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    let running = openingBalance;
    const computed = sorted.map((tx) => {
      let moneyIn = 0;
      let moneyOut = 0;

      if (tx.transaction_type === 'opening_balance') {
        // baseline
      } else if (tx.transaction_type === 'payment_received' || tx.transaction_type === 'cash_added') {
        moneyIn = Number(tx.amount);
        running += moneyIn;
      } else if (tx.transaction_type === 'expense_paid' || tx.transaction_type === 'cash_withdrawn') {
        moneyOut = Number(tx.amount);
        running -= moneyOut;
      } else if (tx.transaction_type === 'correction') {
        if (Number(tx.amount) >= 0) {
          moneyIn = Number(tx.amount);
          running += moneyIn;
        } else {
          moneyOut = Math.abs(Number(tx.amount));
          running -= moneyOut;
        }
      }

      return {
        ...tx,
        moneyIn,
        moneyOut,
        balanceAfter: running,
      };
    });

    // Return reversed for latest first display
    return computed.reverse();
  }, [cashTransactions, openingBalance]);

  // Handle Adjustment Submit
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjAmount <= 0) {
      toast.error('Adjustment amount must be greater than zero');
      return;
    }
    if (!adjDesc.trim()) {
      toast.error('Please provide a mandatory explanation for this audit entry');
      return;
    }

    const success = await recordCashAdjustment(adjType, adjAmount, adjDesc.trim());
    if (success) {
      toast.success('Cash adjustment recorded into ledger!');
      setShowAdjModal(false);
      setAdjDesc('');
    } else {
      toast.error('Failed to record adjustment');
    }
  };

  // Handle Opening Balance Submit
  const handleOpeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      toast.error('Only Admin can modify Opening Cash Balance');
      return;
    }
    const success = await updateOpeningBalance(newOpening);
    if (success) {
      toast.success(`Opening balance updated to ${formatINR(newOpening)}`);
      setShowOpeningModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Available Cash & Bank Balance
          </h1>
          <p className="text-xs text-neutral-400">
            Real-time liquid capital tracker matching verified payments and paid expenses
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setNewOpening(openingBalance);
                setShowOpeningModal(true);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-elevated border border-surface-border text-neutral-300"
            >
              Edit Opening Balance
            </button>
          )}

          <button
            onClick={() => setShowAdjModal(true)}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-gold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Cash Adjustment</span>
          </button>
        </div>
      </div>

      {/* Hero Cash Balance Card */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-surface-card via-surface-elevated to-surface-card border-2 border-gold-500/40 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className="w-5 h-5 text-gold-400" />
              <span className="text-xs font-bold text-gold-300 uppercase tracking-widest">
                ROYAL SPARKS FX AVAILABLE CASH
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-black text-gold-300 tracking-tight">
              {formatINR(stats.availableCash)}
            </div>
            <p className="text-xs text-neutral-400 mt-2 max-w-lg">
              Current liquid money available in hand and business bank accounts right now. Only actual payments collected increase this, and only paid expenses decrease this.
            </p>
          </div>

          {/* Breakdown Mini Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-4 rounded-2xl border border-surface-border">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                Opening Balance
              </span>
              <span className="text-sm sm:text-base font-bold text-white">
                {formatINR(openingBalance)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                Payments In
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">
                +{formatINR(stats.totalReceived)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                Expenses Paid
              </span>
              <span className="text-sm sm:text-base font-bold text-expense">
                -{formatINR(stats.totalExpenses - stats.unpaidExpenses)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                Accounting Profit
              </span>
              <span className="text-sm sm:text-base font-bold text-profit">
                {formatINR(stats.overallProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Formula Notice */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-xs text-neutral-300 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Strict Financial Separation:</strong> Expected Accounting Profit ({formatINR(stats.overallProfit)}) is separate from Available Cash ({formatINR(stats.availableCash)}). An event might have ₹40,000 expected profit, but if the client hasn&apos;t paid yet, it doesn&apos;t increase cash until actual receipt is verified!
        </div>
      </div>

      {/* Cash Transaction Ledger */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gold-400" />
            <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
              Cash Transaction Ledger ({ledgerWithRunningBalance.length})
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">Complete audit trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-elevated/50 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4 text-right">Money In (+)</th>
                <th className="py-3 px-4 text-right">Money Out (-)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {ledgerWithRunningBalance.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-300 font-medium">
                    {formatDateTime(tx.transaction_date)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{tx.description}</span>
                    {tx.event_id && (
                      <Link
                        href={`/events/${tx.event_id}`}
                        className="text-[10px] text-gold-400 hover:underline"
                      >
                        View Event
                      </Link>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-surface border border-surface-border text-neutral-300">
                      {tx.transaction_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    {tx.moneyIn > 0 ? `+${formatINR(tx.moneyIn)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-expense">
                    {tx.moneyOut > 0 ? `-${formatINR(tx.moneyOut)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-gold-300 text-sm">
                    {formatINR(tx.balanceAfter)}
                  </td>
                  <td className="py-3 px-4 text-neutral-400 text-[11px]">
                    {tx.created_by_name || 'System / Admin'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Cash Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleAdjustmentSubmit}
            className="w-full max-w-md bg-surface-elevated border border-gold-500/40 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white font-serif">Manual Cash Adjustment</h3>
              <button
                type="button"
                onClick={() => setShowAdjModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Adjustment Type</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white text-xs"
                >
                  <option value="cash_added">Cash Added (Owner Capital / Deposit)</option>
                  <option value="cash_withdrawn">Cash Withdrawn (Drawings / Bank Transfer)</option>
                  <option value="correction">Audit Correction Entry</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Amount (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white text-sm font-bold text-gold-300"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Mandatory Description & Purpose <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  placeholder="e.g. Added personal funds for advance SFX pyrotechnics stock purchase"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white"
                />
              </div>

              <p className="text-[10px] text-neutral-400">
                Action will be permanently recorded under: <strong>{currentUser.full_name}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setShowAdjModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-surface text-neutral-300 hover:bg-surface-card"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-gold"
              >
                Confirm Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Opening Balance Modal */}
      {showOpeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleOpeningSubmit}
            className="w-full max-w-sm bg-surface-elevated border border-surface-border rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white font-serif">
              Update Opening Cash Balance
            </h3>
            <p className="text-xs text-neutral-400">
              Set the starting capital available at the beginning of Royal Sparks FX operations.
            </p>

            <div>
              <label className="text-neutral-300 text-xs font-semibold block mb-1">
                Opening Cash Balance (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={newOpening}
                onChange={(e) => setNewOpening(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-surface-border text-white text-base font-bold text-gold-300"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setShowOpeningModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-surface text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gold-500 text-black"
              >
                Save Balance
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
