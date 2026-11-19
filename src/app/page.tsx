'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '@/lib/store';
import { formatINR, formatDate } from '@/lib/formatters';
import { calculateEventFinances } from '@/lib/calculations';
import {
  CalendarDays,
  TrendingUp,
  Receipt,
  PiggyBank,
  CheckCircle2,
  Clock,
  Wallet,
  Calculator,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  History,
  Landmark,
  Edit3,
  X,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LedgerItem {
  id: string;
  date: string;
  description: string;
  eventName?: string;
  eventId?: string;
  type: 'opening_balance' | 'payment_received' | 'expense_paid' | 'cash_added' | 'cash_withdrawn';
  typeLabel: string;
  category?: string;
  paymentMethod?: string;
  moneyIn: number;
  moneyOut: number;
  runningBalance: number;
  recordedBy: string;
}

export default function DashboardPage() {
  const {
    events,
    stats,
    cashTransactions,
    currentUser,
    addMoney,
    withdrawMoney,
    updateOpeningBalance,
  } = useBusinessStore();

  // State for Modals
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isEditOpeningOpen, setIsEditOpeningOpen] = useState(false);

  // Form states for Add Money
  const [addAmount, setAddAmount] = useState('');
  const [addDate, setAddDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [addCategory, setAddCategory] = useState('Additional capital');
  const [addMethod, setAddMethod] = useState('bank_transfer');
  const [addDescription, setAddDescription] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Form states for Withdraw Money
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [withdrawCategory, setWithdrawCategory] = useState('Personal withdrawal');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawBypassLimit, setWithdrawBypassLimit] = useState(false);
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  // Form states for Edit Opening Balance
  const [newOpeningBalance, setNewOpeningBalance] = useState(() => stats.openingCashBalance.toString());
  const [openingReason, setOpeningReason] = useState('');
  const [openingConfirmed, setOpeningConfirmed] = useState(false);
  const [isSubmittingOpening, setIsSubmittingOpening] = useState(false);

  // Business Balance History states
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'in' | 'out'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 1. Chart Data: Monthly Revenue vs Expenses & Overall Profit
  const monthlyChartData = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};

    events.forEach((evt) => {
      if (evt.status === 'cancelled') return;
      const date = new Date(evt.event_date);
      const key = !isNaN(date.getTime())
        ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
        : 'Recent';

      if (!map[key]) {
        map[key] = { month: key, revenue: 0, expenses: 0, profit: 0 };
      }

      const fin = calculateEventFinances(evt);
      map[key].revenue += fin.clientCharge;
      map[key].expenses += fin.totalExpenses;
      map[key].profit += fin.expectedProfit;
    });

    const values = Object.values(map);
    return values.length > 0 ? values : [{ month: 'Current', revenue: 75000, expenses: 19500, profit: 55500 }];
  }, [events]);

  // 2. Recent Events (Sorted latest first)
  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .slice(0, 6);
  }, [events]);

  // 3. Unified Business Balance History Ledger
  const fullLedger = useMemo<LedgerItem[]>(() => {
    const rawItems: Omit<LedgerItem, 'runningBalance'>[] = [];

    // A. Original Opening Balance (Baseline)
    rawItems.push({
      id: 'tx-opening-base',
      date: '2026-10-01T00:00:00Z',
      description: 'Original Business Balance / Opening Balance',
      type: 'opening_balance',
      typeLabel: 'Opening Balance',
      moneyIn: stats.openingCashBalance,
      moneyOut: 0,
      recordedBy: 'Admin / Founding Member',
    });

    // B. Actual Event Client Payments Received
    events.forEach((evt) => {
      if (evt.status === 'cancelled') return;
      (evt.payments || []).forEach((pmt, pIdx) => {
        const amt = Number(pmt.amount) || 0;
        if (amt > 0) {
          rawItems.push({
            id: `evt-pmt-${pmt.id || pIdx}`,
            date: pmt.payment_date || pmt.created_at || evt.event_date,
            description: pmt.notes || `Client payment received for ${evt.event_name}`,
            eventName: evt.event_name,
            eventId: evt.id,
            type: 'payment_received',
            typeLabel: 'Client Payment',
            paymentMethod: pmt.payment_method?.toUpperCase(),
            moneyIn: amt,
            moneyOut: 0,
            recordedBy: evt.client_name ? `Client: ${evt.client_name}` : 'Recorded Member',
          });
        }
      });
    });

    // C. Event Expenses Paid (Only status === 'paid')
    events.forEach((evt) => {
      if (evt.status === 'cancelled') return;
      (evt.expenses || []).forEach((exp, eIdx) => {
        if (exp.payment_status === 'paid') {
          const amt = Number(exp.amount) || 0;
          if (amt > 0) {
            rawItems.push({
              id: `evt-exp-${exp.id || eIdx}`,
              date: exp.expense_date || evt.event_date,
              description: `${exp.category}: ${exp.description || 'Event Expense'}`,
              eventName: evt.event_name,
              eventId: evt.id,
              type: 'expense_paid',
              typeLabel: 'Event Expense (Paid)',
              category: exp.category,
              paymentMethod: exp.payment_method?.toUpperCase() || 'PAID',
              moneyIn: 0,
              moneyOut: amt,
              recordedBy: 'Business Member',
            });
          }
        }
      });
    });

    // D. Manual Money Added & Withdrawn from cashTransactions
    cashTransactions.forEach((tx) => {
      if (tx.transaction_type === 'cash_added') {
        rawItems.push({
          id: tx.id,
          date: tx.transaction_date || tx.created_at || new Date().toISOString(),
          description: tx.description || 'Manual Money Addition',
          type: 'cash_added',
          typeLabel: 'Money Added',
          category: tx.category || 'Capital Addition',
          paymentMethod: tx.payment_method?.toUpperCase(),
          moneyIn: Number(tx.amount) || 0,
          moneyOut: 0,
          recordedBy: tx.created_by_name || 'Member',
        });
      } else if (tx.transaction_type === 'cash_withdrawn') {
        rawItems.push({
          id: tx.id,
          date: tx.transaction_date || tx.created_at || new Date().toISOString(),
          description: tx.description || 'Manual Withdrawal',
          type: 'cash_withdrawn',
          typeLabel: 'Money Withdrawn',
          category: tx.category || 'Personal Withdrawal',
          paymentMethod: tx.payment_method?.toUpperCase(),
          moneyIn: 0,
          moneyOut: Number(tx.amount) || 0,
          recordedBy: tx.created_by_name || 'Member',
        });
      }
    });

    // Sort chronologically ascending to compute running balance accurately
    rawItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const computed = rawItems.map((item) => {
      running += item.moneyIn - item.moneyOut;
      return {
        ...item,
        runningBalance: running,
      };
    });

    return computed;
  }, [events, stats.openingCashBalance, cashTransactions]);

  // Filtered and sorted ledger for display
  const displayedLedger = useMemo(() => {
    let list = [...fullLedger];

    // Filter type
    if (historyFilter === 'in') {
      list = list.filter((item) => item.moneyIn > 0);
    } else if (historyFilter === 'out') {
      list = list.filter((item) => item.moneyOut > 0);
    }

    // Search query
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.description.toLowerCase().includes(q) ||
          (item.eventName && item.eventName.toLowerCase().includes(q)) ||
          item.typeLabel.toLowerCase().includes(q) ||
          item.recordedBy.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q))
      );
    }

    // Sort order
    if (sortOrder === 'desc') {
      list.reverse();
    }

    return list;
  }, [fullLedger, historyFilter, historySearch, sortOrder]);

  // Handle Add Money Submit
  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!addDescription.trim()) {
      alert('Please provide a brief description.');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await addMoney({
        amount: amt,
        date: addDate,
        category: addCategory,
        payment_method: addMethod,
        description: addDescription.trim(),
      });
      setIsAddMoneyOpen(false);
      setAddAmount('');
      setAddDescription('');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Withdraw Money Submit
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    const amt = parseFloat(withdrawAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setWithdrawError('Please enter a valid positive amount.');
      return;
    }
    if (!withdrawDescription.trim()) {
      setWithdrawError('Please provide a reason or description for withdrawal.');
      return;
    }

    // Check for accidental negative balance
    if (amt > stats.currentBusinessBalance && !withdrawBypassLimit) {
      setWithdrawError(
        `Withdrawal of ${formatINR(amt)} exceeds current available balance of ${formatINR(
          stats.currentBusinessBalance
        )}. Check the authorization box below if this is an approved correction.`
      );
      return;
    }

    if (!withdrawConfirmed) {
      setWithdrawError('Please check the confirmation box before submitting this withdrawal.');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await withdrawMoney({
        amount: amt,
        date: withdrawDate,
        category: withdrawCategory,
        payment_method: withdrawMethod,
        description: withdrawDescription.trim(),
        bypassLimit: withdrawBypassLimit,
      });

      if (!res.success) {
        setWithdrawError(res.error || 'Failed to complete withdrawal.');
      } else {
        setIsWithdrawOpen(false);
        setWithdrawAmount('');
        setWithdrawDescription('');
        setWithdrawConfirmed(false);
        setWithdrawBypassLimit(false);
      }
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Handle Edit Opening Balance Submit
  const handleEditOpeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(newOpeningBalance);
    if (isNaN(bal) || bal < 0) {
      alert('Please enter a valid opening balance amount.');
      return;
    }
    if (!openingConfirmed) {
      alert('Please confirm that you authorize this opening balance adjustment.');
      return;
    }

    setIsSubmittingOpening(true);
    try {
      await updateOpeningBalance(bal);
      setIsEditOpeningOpen(false);
      setOpeningConfirmed(false);
      setOpeningReason('');
    } finally {
      setIsSubmittingOpening(false);
    }
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-elevated p-2.5 rounded-lg border border-gold-500/30 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-gold-300">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.stroke || entry.fill }}>
              {entry.name}: {formatINR(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Financial Dashboard
          </h1>
          <p className="text-xs text-neutral-400">
            Royal Sparks FX centralized business and event financial overview
          </p>
        </div>

        <Link
          href="/calculation"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black shadow-gold hover:opacity-95 transition-all w-full sm:w-auto"
        >
          <Calculator className="w-4 h-4 stroke-[2.5]" />
          <span>New Calculation</span>
        </Link>
      </div>

      {/* Hero Card: Centralized Business Balance Management System */}
      <div className="rounded-2xl bg-gradient-to-br from-neutral-950 via-surface-card to-neutral-900 border-2 border-gold-500/50 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle gold crown watermark background effect */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gold-500/20 text-gold-300 border border-gold-500/30 flex items-center gap-1.5">
                <Landmark className="w-3 h-3 text-gold-400" />
                <span>CENTRALIZED BUSINESS BALANCE</span>
              </span>
              <span className="text-[10px] text-neutral-400 hidden sm:inline">
                Live Centralized Treasury
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-200 tracking-tight">
                {formatINR(stats.currentBusinessBalance)}
              </span>
              <span className="text-xs text-neutral-400 font-medium">Actual Available Cash</span>
            </div>
          </div>

          {/* Quick Action Buttons for Manual Money Management */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setIsAddMoneyOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Money</span>
            </button>
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              <span>- Withdraw Money</span>
            </button>
          </div>
        </div>

        {/* Section E: Exact Balance Formula Breakdown Indicators */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="font-semibold text-neutral-300">Balance Formula Breakdown:</span>
            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              Opening + Payments Received - Paid Expenses + Added - Withdrawn
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* 1. Opening Balance */}
            <div className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border/80 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-400">
                <span className="truncate">Original Balance</span>
                <button
                  onClick={() => {
                    setNewOpeningBalance(stats.openingCashBalance.toString());
                    setIsEditOpeningOpen(true);
                  }}
                  title="Correct Opening Balance (Admin)"
                  className="p-1 rounded hover:bg-gold-500/20 text-gold-400 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-1 font-bold text-sm sm:text-base text-white">
                {formatINR(stats.openingCashBalance)}
              </div>
              <span className="text-[9px] text-neutral-500">Starting baseline</span>
            </div>

            {/* 2. Total Client Payments Received */}
            <div className="p-3 rounded-xl bg-surface-elevated/70 border border-emerald-500/20 flex flex-col justify-between">
              <div className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3" />
                <span>+ Client Payments</span>
              </div>
              <div className="mt-1 font-bold text-sm sm:text-base text-emerald-400">
                +{formatINR(stats.totalClientPaymentsReceived)}
              </div>
              <span className="text-[9px] text-neutral-500">Only actual received</span>
            </div>

            {/* 3. Total Paid Event Expenses */}
            <div className="p-3 rounded-xl bg-surface-elevated/70 border border-rose-500/20 flex flex-col justify-between">
              <div className="text-[10px] text-rose-400 font-semibold truncate flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>- Paid Expenses</span>
              </div>
              <div className="mt-1 font-bold text-sm sm:text-base text-rose-400">
                -{formatINR(stats.totalPaidExpenses)}
              </div>
              <span className="text-[9px] text-neutral-500">Paid event costs only</span>
            </div>

            {/* 4. Manual Money Added */}
            <div className="p-3 rounded-xl bg-surface-elevated/70 border border-emerald-500/20 flex flex-col justify-between">
              <div className="text-[10px] text-emerald-300 font-semibold truncate flex items-center gap-1">
                <Plus className="w-3 h-3" />
                <span>+ Manual Added</span>
              </div>
              <div className="mt-1 font-bold text-sm sm:text-base text-emerald-300">
                +{formatINR(stats.manualMoneyAdded)}
              </div>
              <span className="text-[9px] text-neutral-500">Capital & deposits</span>
            </div>

            {/* 5. Manual Money Withdrawn */}
            <div className="p-3 rounded-xl bg-surface-elevated/70 border border-rose-500/20 flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="text-[10px] text-rose-300 font-semibold truncate flex items-center gap-1">
                <Minus className="w-3 h-3" />
                <span>- Manual Withdrawn</span>
              </div>
              <div className="mt-1 font-bold text-sm sm:text-base text-rose-300">
                -{formatINR(stats.manualMoneyWithdrawn)}
              </div>
              <span className="text-[9px] text-neutral-500">Partner & purchases</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards (6 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. Total Events */}
        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold">Total Events</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.totalEvents}</div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Total booked events</p>
          </div>
        </div>

        {/* 2. Total Client Charges (Revenue) */}
        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold">Total Client Charges</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatINR(stats.totalRevenue)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Total contract charge</p>
          </div>
        </div>

        {/* 3. Total Expenses */}
        <div className="p-4 rounded-2xl bg-surface-card border border-expense/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold">Total Expenses</span>
            <div className="p-1.5 rounded-lg bg-expense-bg text-expense">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-expense">
              {formatINR(stats.totalExpenses)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Materials & logistics</p>
          </div>
        </div>

        {/* 4. Overall Profit */}
        <div className="p-4 rounded-2xl bg-surface-card border border-profit/40 flex flex-col justify-between shadow-sm shadow-profit/10">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-profit">Overall Profit</span>
            <div className="p-1.5 rounded-lg bg-profit-bg text-profit">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-profit">
              {formatINR(stats.overallProfit)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Expected net profit</p>
          </div>
        </div>

        {/* 5. Total Amount Received */}
        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold">Total Amount Received</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {formatINR(stats.totalReceived)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Paid by clients</p>
          </div>
        </div>

        {/* 6. Pending Client Payments */}
        <div className="p-4 rounded-2xl bg-surface-card border border-pending/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold">Pending Client Payments</span>
            <div className="p-1.5 rounded-lg bg-pending-bg text-royalOrange">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-royalOrange">
              {formatINR(stats.pendingPayments)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Outstanding collection</p>
          </div>
        </div>
      </div>

      {/* Expandable Section F: Business Balance History */}
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border/70">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-gold-500/10 text-gold-300 transition-colors"
            >
              {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gold-400" />
                <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                  Business Balance History
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-bold border border-gold-500/30">
                  {fullLedger.length} Records
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Audited chronological ledger of all money in, money out, and updated business balance
              </p>
            </div>
          </div>

          {/* Filter Pills & Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-surface-elevated p-1 border border-surface-border text-xs">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  historyFilter === 'all'
                    ? 'bg-gold-500 text-black shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHistoryFilter('in')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  historyFilter === 'in'
                    ? 'bg-emerald-500 text-black shadow'
                    : 'text-neutral-400 hover:text-emerald-400'
                }`}
              >
                Money In
              </button>
              <button
                onClick={() => setHistoryFilter('out')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  historyFilter === 'out'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-neutral-400 hover:text-rose-400'
                }`}
              >
                Money Out
              </button>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-surface-elevated border border-surface-border text-neutral-300 hover:text-gold-300 transition-colors"
            >
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>

        {/* Search input when expanded */}
        {isHistoryExpanded && (
          <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-surface-border/40 bg-surface-card/60">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search transaction description, event name, category, or member..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ledger Table / List */}
        {isHistoryExpanded && (
          <div className="overflow-x-auto">
            {displayedLedger.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">
                No balance transactions match your current search or filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-elevated/80 border-b border-surface-border text-neutral-400 font-semibold text-[11px]">
                    <th className="py-2.5 px-3 sm:px-4">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Event</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Money In</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">Money Out</th>
                    <th className="py-2.5 px-3 text-right text-gold-300 font-bold">Updated Balance</th>
                    <th className="py-2.5 px-3 hidden lg:table-cell">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40">
                  {displayedLedger.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-surface-elevated/40 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-3 sm:px-4 text-neutral-300 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      {/* Description & metadata */}
                      <td className="py-3 px-3 max-w-[200px] sm:max-w-xs">
                        <div className="font-semibold text-white line-clamp-1 group-hover:text-gold-200">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          {tx.category && (
                            <span className="px-1.5 py-0.2 rounded bg-surface-elevated border border-surface-border/60">
                              {tx.category}
                            </span>
                          )}
                          {tx.paymentMethod && (
                            <span className="uppercase text-neutral-400">{tx.paymentMethod}</span>
                          )}
                          <span className="md:hidden text-gold-400">
                            {tx.eventName ? `• ${tx.eventName}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Event Name */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        {tx.eventId ? (
                          <Link
                            href={`/calculation?id=${tx.eventId}`}
                            className="text-gold-400 hover:underline line-clamp-1"
                          >
                            {tx.eventName}
                          </Link>
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </td>

                      {/* Transaction Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            tx.type === 'opening_balance'
                              ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                              : tx.type === 'payment_received' || tx.type === 'cash_added'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {tx.typeLabel}
                        </span>
                      </td>

                      {/* Money In */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                        {tx.moneyIn > 0 ? `+${formatINR(tx.moneyIn)}` : <span className="text-neutral-600 font-normal">—</span>}
                      </td>

                      {/* Money Out */}
                      <td className="py-3 px-3 text-right font-bold text-rose-400 whitespace-nowrap">
                        {tx.moneyOut > 0 ? `-${formatINR(tx.moneyOut)}` : <span className="text-neutral-600 font-normal">—</span>}
                      </td>

                      {/* Updated Running Balance */}
                      <td className="py-3 px-3 text-right font-extrabold text-gold-300 whitespace-nowrap bg-surface-elevated/20">
                        {formatINR(tx.runningBalance)}
                      </td>

                      {/* Recorded By */}
                      <td className="py-3 px-3 text-neutral-400 hidden lg:table-cell text-[11px] whitespace-nowrap truncate max-w-[120px]">
                        {tx.recordedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Two Specified Charts: Monthly Revenue vs Expenses & Overall Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Monthly Revenue vs Expenses */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-serif">
              Monthly Revenue vs Expenses
            </h3>
            <span className="text-[10px] text-neutral-400">Bar Chart</span>
          </div>
          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="month" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Overall Profit */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-serif">
              Overall Profit Trend
            </h3>
            <span className="text-[10px] text-neutral-400">Net Profit</span>
          </div>
          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="month" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10B981', stroke: '#000' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Events List Required by Section 1 */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-serif">
              Recent Events
            </h3>
            <p className="text-[11px] text-neutral-400">
              Click any event card to view or edit in Calculation
            </p>
          </div>
          <Link
            href="/calculation"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
          >
            <span>+ Add Calculation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentEvents.map((evt) => {
            const fin = calculateEventFinances(evt);

            return (
              <Link
                key={evt.id}
                href={`/calculation?id=${evt.id}`}
                className="p-4 rounded-xl bg-surface-elevated/70 border border-surface-border hover:border-gold-500/40 transition-all hover:bg-surface-elevated flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] text-neutral-400">
                      {formatDate(evt.event_date)}
                    </span>
                    <span className="text-[10px] text-gold-400 font-semibold group-hover:underline flex items-center gap-0.5">
                      <span>Edit</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                    {evt.event_name}
                  </h4>
                  {evt.client_name && (
                    <p className="text-[11px] text-neutral-400 line-clamp-1">
                      {evt.client_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border/50 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Charge</span>
                    <span className="font-semibold text-white">{formatINR(fin.clientCharge)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Expenses</span>
                    <span className="font-semibold text-expense">{formatINR(fin.totalExpenses)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Profit</span>
                    <span className={`font-semibold ${fin.expectedProfit >= 0 ? 'text-profit' : 'text-expense'}`}>
                      {formatINR(fin.expectedProfit)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD MONEY (Manual Capital Addition)                              */}
      {/* ========================================================================= */}
      {isAddMoneyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAddMoneyOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface-elevated text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Add Business Money</h3>
                <p className="text-xs text-neutral-400">Record fresh capital, partner deposit, or income</p>
              </div>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Amount to Add (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 50000"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={addMethod}
                    onChange={(e) => setAddMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Category</label>
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Additional capital">Additional Capital</option>
                  <option value="Money added by a business member">Money added by Member ({currentUser.full_name})</option>
                  <option value="Other income">Other Income / SFX Equipment Rental</option>
                  <option value="Balance correction">Balance Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description / Note *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Member 1 contributed working capital for new Sparcular granules batch"
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMoneyOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Confirm & Add Money'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: WITHDRAW MONEY (Manual Partner/Business Withdrawal)              */}
      {/* ========================================================================= */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border-2 border-rose-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsWithdrawOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface-elevated text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Withdraw Business Funds</h3>
                <p className="text-xs text-neutral-400">Record partner withdrawal or business purchase</p>
              </div>
            </div>

            {/* Current Balance Notice */}
            <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border text-xs flex items-center justify-between">
              <span className="text-neutral-400">Available Business Funds:</span>
              <span className="font-bold text-gold-300">{formatINR(stats.currentBusinessBalance)}</span>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/60 text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{withdrawError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Withdrawal Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 15000"
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(e.target.value);
                    setWithdrawError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={withdrawDate}
                    onChange={(e) => setWithdrawDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Category</label>
                <select
                  value={withdrawCategory}
                  onChange={(e) => setWithdrawCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="Personal withdrawal">Personal Partner Draw</option>
                  <option value="Business purchase">Business Equipment / Material Purchase</option>
                  <option value="Miscellaneous spending">Miscellaneous Spending</option>
                  <option value="Other withdrawal">Other Withdrawal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Reason / Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Partner withdrawal for Member 2 / Purchase of emergency stage cables"
                  value={withdrawDescription}
                  onChange={(e) => setWithdrawDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Accidental Negative Balance Warning & Override */}
              {parseFloat(withdrawAmount) > stats.currentBusinessBalance && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Warning: Exceeds Available Funds</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Withdrawing {formatINR(parseFloat(withdrawAmount) || 0)} will make the business balance negative.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={withdrawBypassLimit}
                      onChange={(e) => setWithdrawBypassLimit(e.target.checked)}
                      className="rounded border-amber-500 text-amber-500"
                    />
                    <span className="text-[11px] text-amber-100 font-medium">
                      Authorize explicit balance correction override
                    </span>
                  </label>
                </div>
              )}

              {/* Required Confirmation Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={withdrawConfirmed}
                    onChange={(e) => setWithdrawConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-700 text-rose-600"
                  />
                  <span>
                    I confirm this withdrawal will immediately deduct from the shared business balance for all three members.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || !withdrawConfirmed}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg transition-all"
                >
                  {isSubmittingWithdraw ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT OPENING BALANCE (Audited Correction)                        */}
      {/* ========================================================================= */}
      {isEditOpeningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border-2 border-gold-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsEditOpeningOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface-elevated text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold-500/20 text-gold-300">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Correct Opening Business Balance</h3>
                <p className="text-xs text-neutral-400">Baseline starting point for all financial calculations</p>
              </div>
            </div>

            <form onSubmit={handleEditOpeningSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Original Opening Balance (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-white font-bold text-sm focus:outline-none focus:border-gold-500"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Currently set to {formatINR(stats.openingCashBalance)}. Stored permanently in database.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Audit Correction Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Opening balance verified with HDFC Bank statement and cash drawer"
                  value={openingReason}
                  onChange={(e) => setOpeningReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-white text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-neutral-300 space-y-1">
                <div className="font-semibold text-gold-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Audit History Notice</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Changing the opening balance recalibrates historical starting funds and will be permanently recorded in the system audit logs under {currentUser.full_name}.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={openingConfirmed}
                    onChange={(e) => setOpeningConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-700 text-gold-500"
                  />
                  <span>
                    I confirm and authorize this opening business balance correction.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpeningOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOpening || !openingConfirmed}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 disabled:opacity-50 text-black shadow-gold transition-all"
                >
                  {isSubmittingOpening ? 'Updating...' : 'Save & Synchronize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}