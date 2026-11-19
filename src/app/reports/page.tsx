'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '@/lib/store';
import { formatINR, formatDate } from '@/lib/formatters';
import { calculateEventFinances } from '@/lib/calculations';
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  Receipt,
  Wallet,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportTab =
  | 'event_pnl'
  | 'monthly_pnl'
  | 'categories'
  | 'outstanding'
  | 'most_profitable';

export default function FinancialReportsPage() {
  const { events, cashTransactions, openingBalance, stats } = useBusinessStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('event_pnl');
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'quarter'>('all');

  // Compute Event P&L Data
  const eventPnlList = useMemo(() => {
    return events
      .filter((e) => e.status !== 'cancelled')
      .map((evt) => {
        const fin = calculateEventFinances(evt);
        const margin = fin.clientCharge > 0 ? Math.round((fin.expectedProfit / fin.clientCharge) * 100) : 0;
        return {
          id: evt.id,
          name: evt.event_name,
          date: evt.event_date,
          client: evt.client_name,
          revenue: fin.clientCharge,
          materialExp: fin.materialExpenses,
          additionalExp: fin.additionalExpenses,
          totalExp: fin.totalExpenses,
          profit: fin.expectedProfit,
          received: fin.totalReceived,
          pending: fin.pendingPayment,
          margin,
          status: evt.status,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events]);

  // Compute Outstanding Payments List
  const outstandingList = useMemo(() => {
    return eventPnlList.filter((e) => e.pending > 0);
  }, [eventPnlList]);

  // Compute Most Profitable Events
  const mostProfitableList = useMemo(() => {
    return [...eventPnlList].sort((a, b) => b.profit - a.profit);
  }, [eventPnlList]);

  // Compute Expense Category Breakdown
  const categoryAnalysis = useMemo(() => {
    const map: Record<string, number> = {
      'SFX Materials': 0,
      Transportation: 0,
      Labour: 0,
      'Equipment Rental': 0,
      Food: 0,
      Accommodation: 0,
      Miscellaneous: 0,
    };

    events.forEach((evt) => {
      (evt.materials || []).forEach((m) => {
        map['SFX Materials'] += Number(m.total_expense) || 0;
      });
      (evt.expenses || []).forEach((exp) => {
        if (map[exp.category] !== undefined) {
          map[exp.category] += Number(exp.amount) || 0;
        } else {
          map['Miscellaneous'] += Number(exp.amount) || 0;
        }
      });
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
  }, [events]);

  // EXPORT TO EXCEL (.xlsx)
  const handleExportExcel = () => {
    try {
      const dataToExport = eventPnlList.map((item) => ({
        'Event Name': item.name,
        Date: item.date,
        'Client Name': item.client,
        'Client Charge (INR)': item.revenue,
        'Material Expenses (INR)': item.materialExp,
        'Additional Expenses (INR)': item.additionalExp,
        'Total Expenses (INR)': item.totalExp,
        'Net Profit (INR)': item.profit,
        'Margin %': `${item.margin}%`,
        'Amount Received (INR)': item.received,
        'Pending Amount (INR)': item.pending,
        Status: item.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Events P&L');

      XLSX.writeFile(workbook, `Royal_Sparks_FX_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel report generated and downloaded!');
    } catch (err: any) {
      toast.error('Failed to export Excel: ' + err.message);
    }
  };

  // EXPORT TO PDF (.pdf)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Brand Header Banner
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, 210, 36, 'F');

      // Title
      doc.setTextColor(212, 175, 55); // Gold
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ROYAL SPARKS FX', 14, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text('Celebrating Your Special Moments — Profit & Loss Financial Statement', 14, 23);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 29);

      // Financial Highlights Box
      doc.setDrawColor(212, 175, 55);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 42, 182, 24, 2, 2, 'FD');

      doc.setTextColor(20, 20, 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL REVENUE', 20, 49);
      doc.text('TOTAL EXPENSES', 65, 49);
      doc.text('OVERALL PROFIT', 115, 49);
      doc.text('AVAILABLE CASH', 160, 49);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 0);
      doc.text(formatINR(stats.totalRevenue), 20, 58);
      doc.setTextColor(180, 0, 0);
      doc.text(formatINR(stats.totalExpenses), 65, 58);
      doc.setTextColor(0, 120, 0);
      doc.text(formatINR(stats.overallProfit), 115, 58);
      doc.setTextColor(180, 140, 20);
      doc.text(formatINR(stats.availableCash), 160, 58);

      // Table of Events
      const tableData = eventPnlList.map((item) => [
        item.date,
        item.name,
        formatINR(item.revenue),
        formatINR(item.totalExp),
        formatINR(item.profit),
        formatINR(item.received),
        formatINR(item.pending),
      ]);

      autoTable(doc, {
        startY: 72,
        head: [['Date', 'Event Name', 'Charge', 'Expenses', 'Profit', 'Received', 'Pending']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [21, 21, 21],
          textColor: [212, 175, 55],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7.5,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
      });

      doc.save(`Royal_Sparks_FX_PnL_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Financial Statement generated and downloaded!');
    } catch (err: any) {
      toast.error('Failed to export PDF: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Financial Analytics & Reports
          </h1>
          <p className="text-xs text-neutral-400">
            Certified profit & loss statements, expense analytics & collection audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-elevated border border-surface-border text-emerald-400 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-gold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Statement</span>
          </button>
        </div>
      </div>

      {/* Top Comprehensive Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Total Revenue</span>
          <span className="text-sm sm:text-base font-bold text-white">{formatINR(stats.totalRevenue)}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Total Materials</span>
          <span className="text-sm sm:text-base font-bold text-expense">{formatINR(stats.totalMaterialExpenses)}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Direct Expenses</span>
          <span className="text-sm sm:text-base font-bold text-expense">{formatINR(stats.totalAdditionalExpenses)}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-card border border-profit/30">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Overall Profit</span>
          <span className="text-sm sm:text-base font-bold text-profit">{formatINR(stats.overallProfit)}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-card border border-emerald-500/30">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Amount Received</span>
          <span className="text-sm sm:text-base font-bold text-emerald-400">{formatINR(stats.totalReceived)}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-card border border-pending/30">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Outstanding Due</span>
          <span className="text-sm sm:text-base font-bold text-royalOrange">{formatINR(stats.pendingPayments)}</span>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-b border-surface-border">
        <button
          onClick={() => setActiveTab('event_pnl')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'event_pnl'
              ? 'bg-gold-500 text-black'
              : 'text-neutral-400 hover:text-white hover:bg-surface-card'
          }`}
        >
          Event-wise Profit & Loss
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'outstanding'
              ? 'bg-gold-500 text-black'
              : 'text-neutral-400 hover:text-white hover:bg-surface-card'
          }`}
        >
          Outstanding Client Dues ({outstandingList.length})
        </button>
        <button
          onClick={() => setActiveTab('most_profitable')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'most_profitable'
              ? 'bg-gold-500 text-black'
              : 'text-neutral-400 hover:text-white hover:bg-surface-card'
          }`}
        >
          Most Profitable Events
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'bg-gold-500 text-black'
              : 'text-neutral-400 hover:text-white hover:bg-surface-card'
          }`}
        >
          Expense Category Breakdown
        </button>
      </div>

      {/* Render Active Report Table */}
      {activeTab === 'event_pnl' && (
        <div className="overflow-hidden rounded-2xl bg-surface-card border border-surface-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-surface-elevated/50 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Production Event</th>
                  <th className="py-3 px-4 text-right">Client Charge</th>
                  <th className="py-3 px-4 text-right">Materials</th>
                  <th className="py-3 px-4 text-right">Direct Costs</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                  <th className="py-3 px-4 text-right">Collected</th>
                  <th className="py-3 px-4 text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {eventPnlList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-300">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <Link href={`/events/${item.id}`} className="hover:text-gold-300">
                        {item.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {formatINR(item.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-300">
                      {formatINR(item.materialExp)}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-300">
                      {formatINR(item.additionalExp)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-profit">
                      {formatINR(item.profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gold-300">
                      {item.margin}%
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                      {formatINR(item.received)}
                    </td>
                    <td className="py-3 px-4 text-right text-royalOrange font-semibold">
                      {formatINR(item.pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'outstanding' && (
        <div className="overflow-hidden rounded-2xl bg-surface-card border border-surface-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-surface-elevated/50 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Event Name</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4 text-right">Total Charge</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {outstandingList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-300 font-medium">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                    <td className="py-3 px-4 text-neutral-300">{item.client || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {formatINR(item.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                      {formatINR(item.received)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-royalOrange text-sm">
                      {formatINR(item.pending)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/events/${item.id}`}
                        className="px-2.5 py-1 rounded bg-gold-500 text-black text-[11px] font-bold"
                      >
                        Collect Payment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'most_profitable' && (
        <div className="overflow-hidden rounded-2xl bg-surface-card border border-surface-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-surface-elevated/50 text-neutral-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4 text-right">Client Charge</th>
                  <th className="py-3 px-4 text-right">Total Expenses</th>
                  <th className="py-3 px-4 text-right">Profit Generated</th>
                  <th className="py-3 px-4 text-right">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {mostProfitableList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gold-400">#{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <Link href={`/events/${item.id}`} className="hover:text-gold-300">
                        {item.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-white font-medium">
                      {formatINR(item.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-expense">
                      {formatINR(item.totalExp)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-profit text-sm">
                      {formatINR(item.profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gold-300">
                      {item.margin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3">
            <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
              Expense Distribution Summary
            </h3>
            <div className="space-y-2.5">
              {categoryAnalysis.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-300">{item.category}</span>
                    <span className="font-bold text-white">
                      {formatINR(item.amount)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 to-royalOrange"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
