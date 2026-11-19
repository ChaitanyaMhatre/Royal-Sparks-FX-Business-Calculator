'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import { BusinessEvent, EventMaterial, EventExpense, ExpenseCategory, PaymentMethod } from '@/types';
import { formatINR } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  Calculator,
  Plus,
  Trash2,
  Calendar,
  Save,
  RefreshCw,
  FolderOpen,
  DollarSign,
  Receipt,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Wallet,
} from 'lucide-react';

function CalculationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('id');
  const dateParam = searchParams.get('date');

  const { events, saveEvent, deleteEvent } = useBusinessStore();

  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Event Details
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');

  // 2. Material Expenses (dynamic rows: Name, Quantity, Price, Total)
  const [materials, setMaterials] = useState<
    Array<{ id: string; material_name: string; quantity: number; unit_price: number; total_expense: number }>
  >([]);

  // 3. Additional Expenses (Description, Category, Amount, Paid/Unpaid)
  const [additionalExpenses, setAdditionalExpenses] = useState<
    Array<{ id: string; description: string; category: ExpenseCategory; amount: number; payment_status: 'paid' | 'unpaid' }>
  >([]);

  // 4. Client Payment
  const [totalClientCharge, setTotalClientCharge] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>('bank_transfer');

  // Load existing event data when selectedEventId changes or on mount
  useEffect(() => {
    if (selectedEventId) {
      const found = events.find((e) => e.id === selectedEventId);
      if (found) {
        setEventName(found.event_name);
        setEventDate(found.event_date);
        setClientName(found.client_name || '');
        setTotalClientCharge(Number(found.total_client_charge) || 0);

        if (found.materials && found.materials.length > 0) {
          setMaterials(
            found.materials.map((m) => ({
              id: m.id || 'm-' + Math.random(),
              material_name: m.material_name,
              quantity: Number(m.quantity) || 0,
              unit_price: Number(m.unit_price) || 0,
              total_expense: (Number(m.quantity) || 0) * (Number(m.unit_price) || 0),
            }))
          );
        } else {
          setMaterials([]);
        }

        if (found.expenses && found.expenses.length > 0) {
          setAdditionalExpenses(
            found.expenses.map((e) => ({
              id: e.id || 'e-' + Math.random(),
              description: e.description || '',
              category: e.category,
              amount: Number(e.amount) || 0,
              payment_status: e.payment_status,
            }))
          );
        } else {
          setAdditionalExpenses([]);
        }

        if (found.payments && found.payments.length > 0) {
          const totalPaid = found.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
          setAmountReceived(totalPaid);
          const latestPmt = found.payments[found.payments.length - 1];
          setPaymentDate(latestPmt.payment_date || new Date().toISOString().split('T')[0]);
          setPaymentMethod(latestPmt.payment_method || 'bank_transfer');
        } else {
          setAmountReceived(0);
        }
      }
    }
  }, [selectedEventId, events]);

  // Reset to empty new form
  const handleStartNew = () => {
    setSelectedEventId('');
    setEventName('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setClientName('');
    setTotalClientCharge(0);
    setAmountReceived(0);
    setMaterials([
      {
        id: 'm-' + Date.now(),
        material_name: 'Sparcular Cold Spark Granules Pack',
        quantity: 2,
        unit_price: 1800,
        total_expense: 3600,
      },
    ]);
    setAdditionalExpenses([
      {
        id: 'e-' + Date.now(),
        description: 'Transport van',
        category: 'Transportation',
        amount: 2000,
        payment_status: 'paid',
      },
    ]);
    router.replace('/calculation');
  };

  // --- Dynamic Materials Handlers ---
  const handleAddMaterial = () => {
    setMaterials([
      ...materials,
      {
        id: 'm-' + Date.now(),
        material_name: 'SFX Material',
        quantity: 1,
        unit_price: 1500,
        total_expense: 1500,
      },
    ]);
  };

  const handleUpdateMaterial = (index: number, field: string, val: any) => {
    const updated = [...materials];
    const row = { ...updated[index], [field]: val };
    const q = Number(row.quantity) || 0;
    const p = Number(row.unit_price) || 0;
    row.total_expense = q * p;
    updated[index] = row;
    setMaterials(updated);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  // --- Dynamic Additional Expenses Handlers ---
  const handleAddExpense = () => {
    setAdditionalExpenses([
      ...additionalExpenses,
      {
        id: 'e-' + Date.now(),
        description: 'On-site SFX technicians',
        category: 'Labour',
        amount: 3000,
        payment_status: 'unpaid',
      },
    ]);
  };

  const handleUpdateExpense = (index: number, field: string, val: any) => {
    const updated = [...additionalExpenses];
    updated[index] = { ...updated[index], [field]: val };
    setAdditionalExpenses(updated);
  };

  const handleRemoveExpense = (index: number) => {
    setAdditionalExpenses(additionalExpenses.filter((_, i) => i !== index));
  };

  // --- Live Calculations ---
  const summary = useMemo(() => {
    const totalMaterials = materials.reduce((s, m) => s + (Number(m.total_expense) || 0), 0);
    const totalAdditional = additionalExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalExpenses = totalMaterials + totalAdditional;
    const clientCharge = Number(totalClientCharge) || 0;
    const received = Number(amountReceived) || 0;
    const pendingClientPayment = Math.max(0, clientCharge - received);
    const expectedProfit = clientCharge - totalExpenses;

    // Actual cash impact: received client money minus actual paid expenses
    const paidExpenses = additionalExpenses
      .filter((e) => e.payment_status === 'paid')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const actualCashImpact = received - paidExpenses;

    return {
      totalMaterials,
      totalAdditional,
      totalExpenses,
      clientCharge,
      received,
      pendingClientPayment,
      expectedProfit,
      actualCashImpact,
    };
  }, [materials, additionalExpenses, totalClientCharge, amountReceived]);

  // Save / Update Handler
  const handleSaveOrUpdate = async (isUpdate: boolean) => {
    if (!eventName.trim()) {
      toast.error('Event Name is required');
      return;
    }
    if (!eventDate) {
      toast.error('Event Date is required');
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<BusinessEvent> = {
      id: isUpdate && selectedEventId ? selectedEventId : undefined,
      event_name: eventName.trim(),
      event_date: eventDate,
      client_name: clientName.trim(),
      total_client_charge: Number(totalClientCharge) || 0,
      status: 'upcoming',
      materials: materials.map((m) => ({
        id: m.id.startsWith('m-') ? 'mat-' + Math.random().toString(36).substring(2, 7) : m.id,
        event_id: selectedEventId || '',
        material_name: m.material_name,
        quantity: Number(m.quantity) || 0,
        unit_price: Number(m.unit_price) || 0,
        total_expense: (Number(m.quantity) || 0) * (Number(m.unit_price) || 0),
      })),
      expenses: additionalExpenses.map((e) => ({
        id: e.id.startsWith('e-') ? 'exp-' + Math.random().toString(36).substring(2, 7) : e.id,
        event_id: selectedEventId || '',
        description: e.description,
        category: e.category,
        amount: Number(e.amount) || 0,
        expense_date: eventDate,
        payment_status: e.payment_status,
        payment_method: e.payment_status === 'paid' ? 'upi' : 'none',
      })),
      payments:
        Number(amountReceived) > 0
          ? [
              {
                id: 'pmt-' + Date.now(),
                event_id: selectedEventId || '',
                amount: Number(amountReceived),
                payment_date: paymentDate,
                payment_method: paymentMethod,
                notes: 'Recorded via Calculation',
              },
            ]
          : [],
    };

    const res = await saveEvent(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(
        isUpdate
          ? 'Event calculations updated & synchronized!'
          : 'New event calculation saved & synchronized!'
      );
      if (res.id) {
        setSelectedEventId(res.id);
      }
    } else {
      toast.error(res.error || 'Failed to save calculation');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Event Finance & Profit Calculation
          </h1>
          <p className="text-xs text-neutral-400">
            Enter material requirements, operational expenses and client payments
          </p>
        </div>

        {/* Start New Event Button */}
        <button
          type="button"
          onClick={handleStartNew}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-elevated border border-gold-500/30 text-gold-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Select previously saved event to edit */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-xs font-semibold text-neutral-300">
            Load Saved Event:
          </span>
        </div>

        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
        >
          <option value="">-- Select previously saved event to edit --</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.event_name} ({ev.event_date})
            </option>
          ))}
        </select>
      </div>

      {/* =========================================================================
          1. EVENT DETAILS
      ========================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-border pb-3">
          <Calendar className="w-4 h-4 text-gold-400" />
          <h2 className="text-sm sm:text-base font-bold text-white font-serif uppercase tracking-wider">
            1. Event Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">
              Event Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-neutral-300 font-semibold block">
              Event Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Grand Royal Wedding - Oberoi Grand"
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className="text-neutral-300 font-semibold block">
              Client Name (optional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Vikram Singhania"
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MATERIAL EXPENSES (Formula: Quantity × Price Per Unit)
      ========================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-serif uppercase tracking-wider">
                2. Material Expenses
              </h2>
              <span className="text-[10px] text-neutral-400">Formula: Quantity × Price Per Unit</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-300 bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20">
              Total: {formatINR(summary.totalMaterials)}
            </span>
            <button
              type="button"
              onClick={handleAddMaterial}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-hover border border-gold-500/30 text-gold-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Material</span>
            </button>
          </div>
        </div>

        {/* Dynamic Material Rows */}
        <div className="space-y-2.5">
          {materials.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">No material rows added.</p>
          ) : (
            materials.map((row, index) => (
              <div
                key={row.id || index}
                className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs"
              >
                {/* Material Name */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400 sm:hidden">
                    Material Name
                  </label>
                  <input
                    type="text"
                    value={row.material_name}
                    onChange={(e) => handleUpdateMaterial(index, 'material_name', e.target.value)}
                    placeholder="e.g. Sparcular Granules, Fanwheel Cartridges..."
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Quantity */}
                <div className="w-full sm:w-24 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Quantity</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={row.quantity}
                    onChange={(e) => handleUpdateMaterial(index, 'quantity', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs font-semibold focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Price Per Unit */}
                <div className="w-full sm:w-32 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Price Per Unit (₹)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={row.unit_price}
                    onChange={(e) => handleUpdateMaterial(index, 'unit_price', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs font-semibold focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Total Amount (Auto Calculated) */}
                <div className="w-full sm:w-32 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Total Amount</label>
                  <div className="px-2.5 py-2 rounded-lg bg-surface/80 border border-surface-border font-bold text-expense text-xs">
                    {formatINR(row.total_expense)}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="self-end sm:self-center sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(index)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================================
          3. ADDITIONAL EXPENSES
      ========================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-rose-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-serif uppercase tracking-wider">
                3. Additional Expenses
              </h2>
              <span className="text-[10px] text-neutral-400">Transportation, labour, rentals & food</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-expense bg-expense/10 px-2.5 py-1 rounded-lg border border-expense/20">
              Total: {formatINR(summary.totalAdditional)}
            </span>
            <button
              type="button"
              onClick={handleAddExpense}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-hover border border-surface-border text-neutral-200 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Dynamic Additional Expense Rows */}
        <div className="space-y-2.5">
          {additionalExpenses.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">No additional expenses added.</p>
          ) : (
            additionalExpenses.map((row, index) => (
              <div
                key={row.id || index}
                className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs"
              >
                {/* Description */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400 sm:hidden">
                    Description
                  </label>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => handleUpdateExpense(index, 'description', e.target.value)}
                    placeholder="Expense details (e.g. Venue freight, Crew food)"
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Category */}
                <div className="w-full sm:w-36 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Category</label>
                  <select
                    value={row.category}
                    onChange={(e) => handleUpdateExpense(index, 'category', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs"
                  >
                    <option value="Transportation">Transportation</option>
                    <option value="Labour">Labour</option>
                    <option value="Equipment Rental">Equipment Rental</option>
                    <option value="Food">Food</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="w-full sm:w-28 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Amount (₹)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={row.amount}
                    onChange={(e) => handleUpdateExpense(index, 'amount', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs font-bold text-expense focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Paid / Unpaid Status */}
                <div className="w-full sm:w-28 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Status</label>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateExpense(
                        index,
                        'payment_status',
                        row.payment_status === 'paid' ? 'unpaid' : 'paid'
                      )
                    }
                    className={`w-full py-2 px-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                      row.payment_status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {row.payment_status}
                  </button>
                </div>

                {/* Remove */}
                <div className="self-end sm:self-center sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(index)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================================
          4. CLIENT PAYMENT
      ========================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-border pb-3">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm sm:text-base font-bold text-white font-serif uppercase tracking-wider">
            4. Client Payment
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">
              Total Amount Charged to Client (₹)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={totalClientCharge}
              onChange={(e) => setTotalClientCharge(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-gold-500/40 text-white font-bold text-sm focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">Amount Received (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amountReceived}
              onChange={(e) => setAmountReceived(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-emerald-500/40 text-emerald-400 font-bold text-sm focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            >
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. AUTOMATIC FINANCIAL SUMMARY
      ========================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-surface-elevated border-2 border-gold-500/40 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gold-400" />
            <h2 className="text-sm sm:text-base font-bold text-gold-300 font-serif uppercase tracking-wider">
              Automatic Financial Summary
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400">Live updated</span>
        </div>

        {/* Live calculated metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-[10px] text-neutral-400 block">Total Material Expenses</span>
            <span className="text-sm sm:text-base font-bold text-expense">
              {formatINR(summary.totalMaterials)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-[10px] text-neutral-400 block">Total Additional Expenses</span>
            <span className="text-sm sm:text-base font-bold text-expense">
              {formatINR(summary.totalAdditional)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-expense/30">
            <span className="text-[10px] text-neutral-400 block">Total Expenses</span>
            <span className="text-sm sm:text-base font-bold text-expense">
              {formatINR(summary.totalExpenses)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-gold-500/30">
            <span className="text-[10px] text-neutral-400 block">Total Client Charge</span>
            <span className="text-sm sm:text-base font-bold text-white">
              {formatINR(summary.clientCharge)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-emerald-500/30">
            <span className="text-[10px] text-neutral-400 block">Amount Received</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400">
              {formatINR(summary.received)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-pending/30">
            <span className="text-[10px] text-neutral-400 block">Pending Client Payment</span>
            <span className="text-sm sm:text-base font-bold text-royalOrange">
              {formatINR(summary.pendingClientPayment)}
            </span>
          </div>

          {/* Expected Event Profit */}
          <div className="p-3 rounded-xl bg-profit-bg border border-profit/40">
            <span className="text-[10px] text-profit font-bold uppercase block">
              Expected Event Profit
            </span>
            <span className="text-base sm:text-lg font-black text-profit">
              {formatINR(summary.expectedProfit)}
            </span>
          </div>

          {/* Actual Cash Impact */}
          <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/40">
            <span className="text-[10px] text-gold-300 font-bold uppercase block">
              Actual Cash Impact
            </span>
            <span className="text-base sm:text-lg font-black text-gold-300">
              {formatINR(summary.actualCashImpact)}
            </span>
          </div>
        </div>

        {/* Buttons Required by Section 2: Save Calculation & Update Calculation */}
        <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveOrUpdate(false)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-surface-card hover:bg-surface-elevated border border-gold-500/40 text-gold-300 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Save Calculation (New)</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveOrUpdate(true)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black shadow-gold hover:opacity-95 flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Saving...' : 'Update Calculation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalculationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading Calculation...</div>}>
      <CalculationContent />
    </Suspense>
  );
}
