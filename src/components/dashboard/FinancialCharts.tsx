'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BusinessEvent, CashTransaction } from '@/types';
import { formatINR } from '@/lib/formatters';
import { calculateEventFinances } from '@/lib/calculations';

interface FinancialChartsProps {
  events: BusinessEvent[];
  cashTransactions: CashTransaction[];
}

const COLORS = ['#D4AF37', '#FF6B00', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];

export default function FinancialCharts({ events, cashTransactions }: FinancialChartsProps) {
  const [activeChart, setActiveChart] = useState<'rev_exp' | 'profit' | 'categories' | 'event_profit' | 'cash_flow'>('rev_exp');

  // 1. Group Monthly Revenue vs Expenses & Monthly Profit
  const monthlyDataMap: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};

  events.forEach((evt) => {
    if (evt.status === 'cancelled') return;
    const date = new Date(evt.event_date);
    const monthKey = !isNaN(date.getTime())
      ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      : 'Current';

    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0, profit: 0 };
    }

    const fin = calculateEventFinances(evt);
    monthlyDataMap[monthKey].revenue += fin.clientCharge;
    monthlyDataMap[monthKey].expenses += fin.totalExpenses;
    monthlyDataMap[monthKey].profit += fin.expectedProfit;
  });

  const monthlyData = Object.values(monthlyDataMap);
  if (monthlyData.length === 0) {
    monthlyData.push({ month: 'Nov 26', revenue: 75000, expenses: 19500, profit: 55500 });
  }

  // 2. Expense Category Distribution
  const categoryMap: Record<string, number> = {};
  events.forEach((evt) => {
    (evt.expenses || []).forEach((exp) => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + Number(exp.amount);
    });
    // Add materials as a category
    const matTotal = (evt.materials || []).reduce((sum, m) => sum + (Number(m.quantity) * Number(m.unit_price)), 0);
    if (matTotal > 0) {
      categoryMap['SFX Materials'] = (categoryMap['SFX Materials'] || 0) + matTotal;
    }
  });

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // 3. Event-wise Profit
  const eventProfitData = events
    .filter((e) => e.status !== 'cancelled')
    .slice(0, 6)
    .map((evt) => {
      const fin = calculateEventFinances(evt);
      return {
        name: evt.event_name.length > 18 ? evt.event_name.substring(0, 16) + '...' : evt.event_name,
        profit: fin.expectedProfit,
        revenue: fin.clientCharge,
        expenses: fin.totalExpenses,
      };
    });

  // 4. Monthly Cash Flow (Area chart)
  const cashFlowMap: Record<string, { date: string; cashIn: number; cashOut: number; netCash: number }> = {};
  cashTransactions.forEach((tx) => {
    const d = new Date(tx.transaction_date);
    const key = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      : 'Nov 1';

    if (!cashFlowMap[key]) {
      cashFlowMap[key] = { date: key, cashIn: 0, cashOut: 0, netCash: 0 };
    }

    if (tx.transaction_type === 'payment_received' || tx.transaction_type === 'cash_added' || tx.transaction_type === 'opening_balance') {
      cashFlowMap[key].cashIn += Number(tx.amount);
      cashFlowMap[key].netCash += Number(tx.amount);
    } else {
      cashFlowMap[key].cashOut += Number(tx.amount);
      cashFlowMap[key].netCash -= Number(tx.amount);
    }
  });

  const cashFlowData = Object.values(cashFlowMap).slice(-8);

  // Custom INR Tooltip
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
    <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
      {/* Chart Selector Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-surface-border">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide">
            Financial Analytics & Trends
          </h3>
          <p className="text-[11px] text-neutral-400">Visualizing real-time business performance</p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          <button
            onClick={() => setActiveChart('rev_exp')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
              activeChart === 'rev_exp'
                ? 'bg-gold-500 text-black font-semibold'
                : 'bg-surface-elevated text-neutral-300 hover:text-white'
            }`}
          >
            Revenue vs Expenses
          </button>
          <button
            onClick={() => setActiveChart('profit')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
              activeChart === 'profit'
                ? 'bg-gold-500 text-black font-semibold'
                : 'bg-surface-elevated text-neutral-300 hover:text-white'
            }`}
          >
            Profit Trend
          </button>
          <button
            onClick={() => setActiveChart('categories')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
              activeChart === 'categories'
                ? 'bg-gold-500 text-black font-semibold'
                : 'bg-surface-elevated text-neutral-300 hover:text-white'
            }`}
          >
            Expense Breakdown
          </button>
          <button
            onClick={() => setActiveChart('event_profit')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
              activeChart === 'event_profit'
                ? 'bg-gold-500 text-black font-semibold'
                : 'bg-surface-elevated text-neutral-300 hover:text-white'
            }`}
          >
            Event P&L
          </button>
          <button
            onClick={() => setActiveChart('cash_flow')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
              activeChart === 'cash_flow'
                ? 'bg-gold-500 text-black font-semibold'
                : 'bg-surface-elevated text-neutral-300 hover:text-white'
            }`}
          >
            Cash Flow
          </button>
        </div>
      </div>

      {/* Render Selected Chart */}
      <div className="w-full h-64 sm:h-80 pt-2">
        {activeChart === 'rev_exp' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="month" stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'profit' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="month" stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
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
        )}

        {activeChart === 'categories' && (
          <div className="flex flex-col sm:flex-row items-center justify-center h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeChart === 'event_profit' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventProfitData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
              <Bar dataKey="profit" name="Expected Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'cash_flow' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="cashIn"
                name="Money In"
                stroke="#D4AF37"
                fillOpacity={1}
                fill="url(#colorCash)"
              />
              <Area
                type="monotone"
                dataKey="cashOut"
                name="Money Out"
                stroke="#EF4444"
                fillOpacity={0.2}
                fill="#EF4444"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
