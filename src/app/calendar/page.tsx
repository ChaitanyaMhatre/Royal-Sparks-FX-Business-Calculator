'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import { calculateEventFinances } from '@/lib/calculations';
import { formatINR, formatDate } from '@/lib/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  CalendarDays,
  Calculator,
  ArrowRight,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CalendarPage() {
  const router = useRouter();
  const { events, deleteEvent } = useBusinessStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate grid days for monthly view
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Events indexed by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach((evt) => {
      if (!map[evt.event_date]) map[evt.event_date] = [];
      map[evt.event_date].push(evt);
    });
    return map;
  }, [events]);

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  // Agenda events sorted chronologically
  const agendaEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
  }, [events]);

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const res = await deleteEvent(id);
      if (res.success) {
        toast.success('Event deleted');
      }
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Events Calendar
          </h1>
          <p className="text-xs text-neutral-400">
            View scheduled event productions and click any date to calculate finances
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month / Agenda Switcher */}
          <div className="flex items-center bg-surface-card p-1 rounded-xl border border-surface-border">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'month'
                  ? 'bg-gold-500 text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-gold-500 text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          <Link
            href={`/calculation?date=${selectedDate}`}
            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-gold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Event</span>
          </Link>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="space-y-4">
          {/* Month Navigation Card */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-wide">
                {monthName}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover text-neutral-300 hover:text-white border border-surface-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover text-neutral-300 hover:text-white border border-surface-border text-xs font-semibold"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover text-neutral-300 hover:text-white border border-surface-border"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Bar */}
            <div className="grid grid-cols-7 text-center py-2 text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[50px] sm:min-h-[75px] p-1 rounded-xl bg-surface/30 opacity-20" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = eventsByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => {
                      setSelectedDate(dateStr);
                    }}
                    className={`min-h-[55px] sm:min-h-[80px] p-1.5 sm:p-2 rounded-xl text-left border flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-gold-500 bg-gold-500/10 shadow-sm shadow-gold-500/20'
                        : isToday
                        ? 'border-neutral-500 bg-surface-elevated'
                        : 'border-surface-border/60 bg-surface-card hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-gold-500 text-black flex items-center justify-center text-[10px]'
                            : isSelected
                            ? 'text-gold-300'
                            : 'text-neutral-300'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-gold-400" />
                      )}
                    </div>

                    {/* Event labels on desktop */}
                    <div className="hidden sm:block space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold truncate bg-surface border border-gold-500/30 text-gold-300"
                        >
                          {ev.event_name}
                        </div>
                      ))}
                    </div>

                    {/* Mobile event count dot */}
                    <div className="sm:hidden flex gap-1 mt-1">
                      {dayEvents.map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            ev.status === 'completed' ? 'bg-emerald-400' : 'bg-gold-400'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events Details Card */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-serif">
                  Events on {formatDate(selectedDate)}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {selectedDateEvents.length} event(s) scheduled
                </p>
              </div>

              <Link
                href={`/calculation?date=${selectedDate}`}
                className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-gold-300 border border-gold-500/30 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event on This Date</span>
              </Link>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">
                No events scheduled on this date. Click above to add an event.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDateEvents.map((evt) => {
                  const fin = calculateEventFinances(evt);

                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border hover:border-gold-500/30 transition-all flex flex-col justify-between space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                evt.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-gold-500/20 text-gold-300'
                              }`}
                            >
                              {evt.status}
                            </span>
                            <h4 className="font-bold text-sm text-white">{evt.event_name}</h4>
                          </div>
                          {evt.client_name && (
                            <p className="text-[11px] text-neutral-400 mt-0.5">{evt.client_name}</p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-profit">
                          {formatINR(fin.expectedProfit)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-t border-surface-border/50 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">Charge</span>
                          <span className="font-semibold text-white">{formatINR(fin.clientCharge)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block">Expenses</span>
                          <span className="font-semibold text-expense">{formatINR(fin.totalExpenses)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block">Pending</span>
                          <span className="font-semibold text-royalOrange">{formatINR(fin.pendingPayment)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-surface-border/40">
                        <Link
                          href={`/calculation?id=${evt.id}`}
                          className="px-3 py-1 rounded-lg bg-gold-500 text-black text-xs font-bold flex items-center gap-1 hover:opacity-90"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit in Calculation</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider border-b border-surface-border pb-3">
            Production Agenda & Timeline ({agendaEvents.length})
          </h3>

          <div className="space-y-3">
            {agendaEvents.map((evt) => {
              const fin = calculateEventFinances(evt);

              return (
                <div
                  key={evt.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-surface-elevated/70 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-black/60 border border-gold-500/30 text-center shrink-0 min-w-[55px]">
                      <div className="text-[10px] uppercase text-neutral-400 font-bold">
                        {new Date(evt.event_date).toLocaleDateString('en-IN', { month: 'short' })}
                      </div>
                      <div className="text-base font-black text-gold-400">
                        {new Date(evt.event_date).getDate()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            evt.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-gold-500/20 text-gold-300'
                          }`}
                        >
                          {evt.status}
                        </span>
                        <h4 className="font-semibold text-sm text-white">{evt.event_name}</h4>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {evt.client_name ? `${evt.client_name} · ` : ''}
                        Charge: {formatINR(fin.clientCharge)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border/50">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Profit</span>
                      <span className="font-bold text-profit">{formatINR(fin.expectedProfit)}</span>
                    </div>
                    <Link
                      href={`/calculation?id=${evt.id}`}
                      className="px-3 py-1.5 rounded-lg bg-gold-500 text-black font-bold flex items-center gap-1 hover:opacity-90"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Calculation</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
