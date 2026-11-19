'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '@/lib/store';
import { formatDateTime } from '@/lib/formatters';
import {
  History,
  Search,
  Filter,
  User,
  Calendar,
  FileCheck,
  CreditCard,
  Receipt,
  Boxes,
  PlusCircle,
  Tag,
} from 'lucide-react';

export default function ActivityHistoryPage() {
  const { activityLogs } = useBusinessStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const membersList = useMemo(() => {
    const set = new Set<string>();
    activityLogs.forEach((l) => set.add(l.user_name));
    return Array.from(set);
  }, [activityLogs]);

  const actionsList = useMemo(() => {
    const set = new Set<string>();
    activityLogs.forEach((l) => set.add(l.action));
    return Array.from(set);
  }, [activityLogs]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (memberFilter !== 'all' && log.user_name !== memberFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.description.toLowerCase().includes(q) ||
          log.user_name.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activityLogs, memberFilter, actionFilter, searchQuery]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'event':
        return Calendar;
      case 'payment':
        return CreditCard;
      case 'expense':
        return Receipt;
      case 'inventory':
        return Boxes;
      default:
        return History;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
          Shared Activity & Audit History
        </h1>
        <p className="text-xs text-neutral-400">
          Permanent log of all updates made by the three business partners in real time
        </p>
      </div>

      {/* Filters Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by description or member..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            >
              <option value="all">All Members</option>
              {membersList.map((m) => (
                <option key={m} value={m}>
                  {m.split(' (')[0]}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
            >
              <option value="all">All Actions</option>
              {actionsList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
            Chronological Audit Log ({filteredLogs.length})
          </h3>
          <span className="text-[11px] text-neutral-400">Synced across all devices</span>
        </div>

        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const Icon = getActionIcon(log.entity_type);

            return (
              <div
                key={log.id}
                className="p-3.5 sm:p-4 rounded-xl bg-surface-elevated/70 border border-surface-border hover:border-gold-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-surface border border-gold-500/20 text-gold-400 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">{log.user_name}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-surface border border-surface-border text-gold-300">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-neutral-200 mt-1 leading-relaxed text-xs">
                      {log.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-neutral-400 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border/50 text-[11px]">
                  <span>{formatDateTime(log.created_at)}</span>
                  {log.entity_id && log.entity_type === 'event' && (
                    <Link
                      href={`/events/${log.entity_id}`}
                      className="text-gold-400 hover:underline font-semibold"
                    >
                      View Event
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
