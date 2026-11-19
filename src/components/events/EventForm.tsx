'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessEvent, EventMaterial, EventExpense, Payment, ExpenseCategory, PaymentMethod, EventStatus } from '@/types';
import { useBusinessStore } from '@/lib/store';
import { formatINR } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Receipt,
  User,
  Phone,
  MapPin,
  Check,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Save,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface EventFormProps {
  initialEvent?: BusinessEvent;
  isEdit?: boolean;
}

const COMMON_MATERIALS = [
  { name: 'Sparcular Cold Spark Granules Pack', defaultPrice: 1800 },
  { name: 'Fanwheel Dual Head Pyro Cartridges', defaultPrice: 2200 },
  { name: 'Flame Thrower Aerosol Fluid Can', defaultPrice: 1600 },
  { name: 'SFX Wireless Receiver (4-channel)', defaultPrice: 1500 },
  { name: 'TMC Synchronized Cue Module', defaultPrice: 2500 },
  { name: 'DMX Isolated Cable & Power Splitter', defaultPrice: 1200 },
  { name: 'Low Fog Dry Ice SFX Pellets (10kg)', defaultPrice: 3500 },
  { name: 'CO2 Stage Jet Cylinder Gas', defaultPrice: 4500 },
];

export default function EventForm({ initialEvent, isEdit = false }: EventFormProps) {
  const router = useRouter();
  const { saveEvent, currentUser } = useBusinessStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SECTION A: Event Information
  const [eventName, setEventName] = useState(initialEvent?.event_name || '');
  const [eventDate, setEventDate] = useState(
    initialEvent?.event_date || new Date().toISOString().split('T')[0]
  );
  const [clientName, setClientName] = useState(initialEvent?.client_name || '');
  const [clientPhone, setClientPhone] = useState(initialEvent?.client_phone || '');
  const [eventLocation, setEventLocation] = useState(initialEvent?.event_location || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [status, setStatus] = useState<EventStatus>(initialEvent?.status || 'upcoming');

  // SECTION B: Dynamic Material Expenses
  const [materials, setMaterials] = useState<EventMaterial[]>(
    initialEvent?.materials && initialEvent.materials.length > 0
      ? initialEvent.materials
      : [
          {
            id: 'mat-' + Date.now(),
            event_id: initialEvent?.id || '',
            material_name: 'Sparcular Cold Spark Granules Pack',
            quantity: 4,
            unit_price: 1800,
            total_expense: 7200,
          },
        ]
  );

  // SECTION C: Dynamic Additional Expenses
  const [expenses, setExpenses] = useState<EventExpense[]>(
    initialEvent?.expenses && initialEvent.expenses.length > 0
      ? initialEvent.expenses
      : [
          {
            id: 'exp-' + Date.now(),
            event_id: initialEvent?.id || '',
            category: 'Transportation',
            description: 'Van freight & haulage to event venue',
            amount: 2500,
            expense_date: initialEvent?.event_date || new Date().toISOString().split('T')[0],
            payment_status: 'paid',
            payment_method: 'upi',
          },
        ]
  );

  // SECTION D: Client Financial Details
  const [totalClientCharge, setTotalClientCharge] = useState<number>(
    initialEvent?.total_client_charge || 50000
  );
  const [payments, setPayments] = useState<Payment[]>(
    initialEvent?.payments && initialEvent.payments.length > 0
      ? initialEvent.payments
      : [
          {
            id: 'pmt-' + Date.now(),
            event_id: initialEvent?.id || '',
            amount: 20000,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'bank_transfer',
            notes: 'Advance booking payment',
            transaction_reference: 'NEFT-' + Math.floor(100000 + Math.random() * 900000),
          },
        ]
  );

  // --- SECTION B Handlers ---
  const handleAddMaterial = (prefillName = '', prefillPrice = 0) => {
    const newMat: EventMaterial = {
      id: 'mat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      event_id: initialEvent?.id || '',
      material_name: prefillName || 'Sparcular Cold Spark Granules Pack',
      quantity: 1,
      unit_price: prefillPrice || 1800,
      total_expense: prefillPrice || 1800,
    };
    setMaterials([...materials, newMat]);
  };

  const handleUpdateMaterial = (index: number, field: keyof EventMaterial, value: any) => {
    const updated = [...materials];
    const item = { ...updated[index], [field]: value };
    // Automatically recalculate row total: Quantity * Unit Price
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    item.total_expense = qty * price;
    updated[index] = item;
    setMaterials(updated);
  };

  const handleRemoveMaterial = (index: number) => {
    if (materials.length <= 1) {
      toast.error('At least one material entry or keep quantity 0');
    }
    setMaterials(materials.filter((_, i) => i !== index));
  };

  // --- SECTION C Handlers ---
  const handleAddExpense = () => {
    const newExp: EventExpense = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      event_id: initialEvent?.id || '',
      category: 'Labour',
      description: 'On-site SFX technicians',
      amount: 3000,
      expense_date: eventDate,
      payment_status: 'unpaid',
      payment_method: 'none',
    };
    setExpenses([...expenses, newExp]);
  };

  const handleUpdateExpense = (index: number, field: keyof EventExpense, value: any) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // --- SECTION D Handlers ---
  const handleAddPayment = () => {
    const newPmt: Payment = {
      id: 'pmt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      event_id: initialEvent?.id || '',
      amount: 10000,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'upi',
      notes: 'Second installment',
      transaction_reference: '',
    };
    setPayments([...payments, newPmt]);
  };

  const handleUpdatePayment = (index: number, field: keyof Payment, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  // --- SECTION E: Live Financial Summary Calculations ---
  const finances = useMemo(() => {
    const totalMaterials = materials.reduce((sum, m) => sum + (Number(m.total_expense) || 0), 0);
    const totalAdditional = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalEventExpenses = totalMaterials + totalAdditional;
    const clientCharge = Number(totalClientCharge) || 0;
    const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingPayment = Math.max(0, clientCharge - totalReceived);
    const expectedProfit = clientCharge - totalEventExpenses;

    return {
      totalMaterials,
      totalAdditional,
      totalEventExpenses,
      clientCharge,
      totalReceived,
      pendingPayment,
      expectedProfit,
    };
  }, [materials, expenses, totalClientCharge, payments]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      id: initialEvent?.id,
      event_name: eventName.trim(),
      event_date: eventDate,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      event_location: eventLocation.trim(),
      description: description.trim(),
      status,
      total_client_charge: Number(totalClientCharge) || 0,
      version: initialEvent?.version,
      materials: materials.map((m) => ({
        ...m,
        quantity: Number(m.quantity) || 0,
        unit_price: Number(m.unit_price) || 0,
        total_expense: (Number(m.quantity) || 0) * (Number(m.unit_price) || 0),
      })),
      expenses: expenses.map((exp) => ({
        ...exp,
        amount: Number(exp.amount) || 0,
      })),
      payments: payments.map((pmt) => ({
        ...pmt,
        amount: Number(pmt.amount) || 0,
      })),
    };

    const res = await saveEvent(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(isEdit ? 'Event successfully updated!' : 'Event created & synchronized across members!');
      router.push(`/events/${res.id || initialEvent?.id}`);
    } else {
      toast.error(res.error || 'Failed to save event');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Back & Title Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={isEdit ? `/events/${initialEvent?.id}` : '/events'}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-neutral-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold font-serif text-white tracking-wide">
              {isEdit ? 'Edit Event Production' : 'Create New Event Production'}
            </h1>
            <p className="text-xs text-neutral-400">
              5-Section Comprehensive Financial & Material Setup
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black hover:opacity-90 shadow-gold transition-all"
        >
          <Save className="w-4 h-4 stroke-[2.5]" />
          <span>{isSubmitting ? 'Saving...' : 'Save Event'}</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION A: EVENT INFORMATION
      ========================================================================== */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-border pb-3">
          <span className="w-6 h-6 rounded-full bg-gold-500 text-black font-bold flex items-center justify-center text-xs">
            A
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide">
            SECTION A – EVENT INFORMATION
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-300">
              Event Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Grand Royal Wedding - Oberoi Grand"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Event Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Vikram Singhania"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Client Phone Number</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="e.g. +91 98201 12345"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Event Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-semibold text-neutral-300">Event Location / Venue</label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g. The Oberoi Grand Ballroom, Nariman Point, Mumbai"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-semibold text-neutral-300">Description & SFX Cue Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Special instructions, cue timing (e.g. Varmala entry, cake cutting, stage reveal)"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION B: MATERIAL EXPENSES (Dynamic Rows & Live Multipliers)
      ========================================================================== */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gold-500 text-black font-bold flex items-center justify-center text-xs">
              B
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide">
                SECTION B – MATERIAL EXPENSES
              </h2>
              <p className="text-[11px] text-neutral-400">
                Formula: Total Expense = Quantity × Price Per Unit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-300 bg-gold-500/10 px-3 py-1 rounded-lg border border-gold-500/20">
              Total Materials: {formatINR(finances.totalMaterials)}
            </span>
            <button
              type="button"
              onClick={() => handleAddMaterial()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-hover border border-gold-500/30 text-gold-300 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] text-neutral-400 shrink-0 font-medium mr-1">Quick Add:</span>
          {COMMON_MATERIALS.slice(0, 4).map((mat) => (
            <button
              key={mat.name}
              type="button"
              onClick={() => handleAddMaterial(mat.name, mat.defaultPrice)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-surface-elevated hover:bg-surface-hover border border-surface-border text-neutral-300 hover:text-white whitespace-nowrap transition-colors"
            >
              + {mat.name.split(' ')[0]} {mat.name.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Dynamic Material Rows */}
        <div className="space-y-3">
          {materials.map((mat, index) => (
            <div
              key={mat.id || index}
              className="p-3 sm:p-4 rounded-xl bg-surface-elevated/70 border border-surface-border flex flex-col sm:flex-row sm:items-center gap-3"
            >
              {/* Material Name */}
              <div className="flex-1 space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400 sm:hidden">
                  Material Name
                </label>
                <input
                  type="text"
                  value={mat.material_name}
                  onChange={(e) => handleUpdateMaterial(index, 'material_name', e.target.value)}
                  placeholder="Material name (Sparcular, Fanwheel, etc.)"
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Quantity */}
              <div className="w-full sm:w-28 space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={mat.quantity}
                  onChange={(e) => handleUpdateMaterial(index, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 font-semibold"
                />
              </div>

              {/* Unit Price */}
              <div className="w-full sm:w-36 space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={mat.unit_price}
                  onChange={(e) => handleUpdateMaterial(index, 'unit_price', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 font-semibold"
                />
              </div>

              {/* Row Total Expense (Auto Calculated) */}
              <div className="w-full sm:w-36 space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">
                  Row Total
                </label>
                <div className="px-3 py-2 rounded-lg bg-surface/80 border border-surface-border text-xs sm:text-sm font-bold text-expense">
                  {formatINR(mat.total_expense)}
                </div>
              </div>

              {/* Delete Button */}
              <div className="self-end sm:self-center sm:pt-4">
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove material row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION C: ADDITIONAL EXPENSES (Transportation, Labour, etc.)
      ========================================================================== */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gold-500 text-black font-bold flex items-center justify-center text-xs">
              C
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide">
                SECTION C – ADDITIONAL EXPENSES
              </h2>
              <p className="text-[11px] text-neutral-400">
                Transportation, Labour, Rentals, Food & On-site Logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-expense bg-expense/10 px-3 py-1 rounded-lg border border-expense/20">
              Additional Exp: {formatINR(finances.totalAdditional)}
            </span>
            <button
              type="button"
              onClick={handleAddExpense}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-hover border border-surface-border text-neutral-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {expenses.map((exp, index) => (
            <div
              key={exp.id || index}
              className="p-3 sm:p-4 rounded-xl bg-surface-elevated/70 border border-surface-border space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">
                    Category
                  </label>
                  <select
                    value={exp.category}
                    onChange={(e) => handleUpdateExpense(index, 'category', e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="Transportation">Transportation</option>
                    <option value="Labour">Labour</option>
                    <option value="Equipment Rental">Equipment Rental</option>
                    <option value="Food">Food</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">
                    Expense Description
                  </label>
                  <input
                    type="text"
                    value={exp.description}
                    onChange={(e) => handleUpdateExpense(index, 'description', e.target.value)}
                    placeholder="Details of expense"
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={exp.amount}
                    onChange={(e) => handleUpdateExpense(index, 'amount', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 font-bold text-expense"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border/50 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status Paid vs Unpaid */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400 font-medium">Status:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateExpense(index, 'payment_status', exp.payment_status === 'paid' ? 'unpaid' : 'paid')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        exp.payment_status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {exp.payment_status}
                    </button>
                  </div>

                  {/* Payment Method */}
                  {exp.payment_status === 'paid' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-neutral-400 font-medium">Method:</span>
                      <select
                        value={exp.payment_method}
                        onChange={(e) => handleUpdateExpense(index, 'payment_method', e.target.value as PaymentMethod)}
                        className="px-2 py-1 rounded-md bg-surface border border-surface-border text-white text-[11px]"
                      >
                        <option value="upi">UPI</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400 font-medium">Date:</span>
                    <input
                      type="date"
                      value={exp.expense_date}
                      onChange={(e) => handleUpdateExpense(index, 'expense_date', e.target.value)}
                      className="px-2 py-1 rounded-md bg-surface border border-surface-border text-white text-[11px]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveExpense(index)}
                  className="text-neutral-500 hover:text-red-400 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION D: CLIENT FINANCIAL DETAILS (Charges & Payments)
      ========================================================================== */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gold-500 text-black font-bold flex items-center justify-center text-xs">
              D
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide">
                SECTION D – CLIENT FINANCIAL DETAILS
              </h2>
              <p className="text-[11px] text-neutral-400">
                Client Billing vs Recorded Payments (Partial / Staged Receipts)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddPayment}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-hover border border-surface-border text-emerald-300 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Payment Receipt</span>
          </button>
        </div>

        {/* Total Client Charge Input */}
        <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30 space-y-1.5">
          <label className="text-xs font-bold text-gold-300 uppercase tracking-wider block">
            Total Amount Charged to Client (₹) <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gold-400">₹</span>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={totalClientCharge}
              onChange={(e) => setTotalClientCharge(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-gold-500/40 text-white font-bold text-lg focus:outline-none focus:border-gold-400"
              placeholder="e.g. 50000"
            />
          </div>
          <p className="text-[11px] text-neutral-400">
            This is the total contract value agreed with the client.
          </p>
        </div>

        {/* Payments List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Client Payment Receipts ({payments.length})
          </h4>

          {payments.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-elevated border border-dashed border-surface-border text-center text-xs text-neutral-400">
              No payments collected yet. (Event can still be saved)
            </div>
          ) : (
            payments.map((pmt, index) => (
              <div
                key={pmt.id || index}
                className="p-3 sm:p-4 rounded-xl bg-surface-elevated/70 border border-surface-border space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Payment Amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400">
                      Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={pmt.amount}
                      onChange={(e) => handleUpdatePayment(index, 'amount', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-emerald-400 font-bold text-sm focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={pmt.payment_date}
                      onChange={(e) => handleUpdatePayment(index, 'payment_date', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400">
                      Payment Method
                    </label>
                    <select
                      value={pmt.payment_method}
                      onChange={(e) => handleUpdatePayment(index, 'payment_method', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                    >
                      <option value="bank_transfer">Bank Transfer (IMPS/NEFT/RTGS)</option>
                      <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Ref Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-400">
                      Reference / UPI ID
                    </label>
                    <input
                      type="text"
                      value={pmt.transaction_reference || ''}
                      onChange={(e) => handleUpdatePayment(index, 'transaction_reference', e.target.value)}
                      placeholder="e.g. UPI-129402"
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-border/50 text-xs">
                  <input
                    type="text"
                    value={pmt.notes || ''}
                    onChange={(e) => handleUpdatePayment(index, 'notes', e.target.value)}
                    placeholder="Notes (e.g. 50% advance token)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePayment(index)}
                    className="text-neutral-500 hover:text-red-400 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION E: LIVE EVENT FINANCIAL SUMMARY (Live Accurate Formulas)
      ========================================================================== */}
      <div className="bg-surface-elevated border-2 border-gold-500/40 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-surface-border pb-3">
          <span className="w-6 h-6 rounded-full bg-gold-500 text-black font-bold flex items-center justify-center text-xs">
            E
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gold-300 font-serif tracking-wide">
              SECTION E – LIVE EVENT FINANCIAL SUMMARY
            </h2>
            <p className="text-[11px] text-neutral-400">
              Instant live calculations matching Royal Sparks FX financial business rules
            </p>
          </div>
        </div>

        {/* Real-time formulas grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-[10px] text-neutral-400 block font-medium">Material Expenses</span>
            <span className="text-sm sm:text-base font-bold text-expense">
              {formatINR(finances.totalMaterials)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-[10px] text-neutral-400 block font-medium">Additional Expenses</span>
            <span className="text-sm sm:text-base font-bold text-expense">
              {formatINR(finances.totalAdditional)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-expense/30">
            <span className="text-[10px] text-neutral-400 block font-medium">Total Event Expenses</span>
            <span className="text-sm sm:text-base font-bold text-expense">
              {formatINR(finances.totalEventExpenses)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-gold-500/30">
            <span className="text-[10px] text-neutral-400 block font-medium">Total Client Charge</span>
            <span className="text-sm sm:text-base font-bold text-white">
              {formatINR(finances.clientCharge)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-emerald-500/30">
            <span className="text-[10px] text-neutral-400 block font-medium">Amount Received</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400">
              {formatINR(finances.totalReceived)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-pending/30">
            <span className="text-[10px] text-neutral-400 block font-medium">Pending Client Payment</span>
            <span className="text-sm sm:text-base font-bold text-royalOrange">
              {formatINR(finances.pendingPayment)}
            </span>
          </div>

          {/* Expected Event Profit (Hero Highlight) */}
          <div className="col-span-2 p-3.5 rounded-xl bg-profit-bg border border-profit/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-profit uppercase tracking-wider block">
                Expected Event Profit
              </span>
              <span className="text-[10px] text-neutral-400">
                Formula: Client Charge - Total Event Expenses
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-profit">
              {formatINR(finances.expectedProfit)}
            </span>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-neutral-400 text-center sm:text-left">
            Saving will automatically update the centralized cash balance, calendar, and sync with all business partners.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black hover:opacity-90 shadow-gold transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Synchronizing...' : 'Save & Publish Event'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
