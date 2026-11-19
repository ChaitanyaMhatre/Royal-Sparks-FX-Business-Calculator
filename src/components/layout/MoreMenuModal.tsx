'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import {
  CalendarDays,
  Receipt,
  FileBarChart,
  Boxes,
  History,
  Settings,
  User,
  LogOut,
  X,
  CreditCard,
  Building2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoreMenuModal({ isOpen, onClose }: MoreMenuModalProps) {
  const pathname = usePathname();
  const { currentUser } = useBusinessStore();

  if (!isOpen) return null;

  const menuItems = [
    {
      title: 'Events & Bookings',
      items: [
        { name: 'All Events', href: '/events', icon: CalendarDays, desc: 'Full event catalogue & status' },
        { name: 'Calendar Schedule', href: '/calendar', icon: CalendarDays, desc: 'Month & agenda view' },
      ],
    },
    {
      title: 'Finance & Payments',
      items: [
        { name: 'Payments Collection', href: '/payments', icon: CreditCard, desc: 'Record & track client payments' },
        { name: 'Cash Balance & Ledger', href: '/cash', icon: DollarSign, desc: 'Real-time available cash balance' },
        { name: 'Financial Reports', href: '/reports', icon: FileBarChart, desc: 'P&L, analytics, PDF & Excel export' },
      ],
    },
    {
      title: 'Operations & Business',
      items: [
        { name: 'Equipment & Inventory', href: '/inventory', icon: Boxes, desc: 'Machines, receivers, controllers' },
        { name: 'Shared Activity History', href: '/activity', icon: History, desc: 'Audit log of member actions' },
        { name: 'Business Settings', href: '/settings', icon: Settings, desc: 'Preferences, members & opening balance' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface-elevated border border-surface-border sm:rounded-2xl rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 relative rounded-lg overflow-hidden border border-gold-500/30">
              <Image
                src="/assets/royal-sparks-fx-logo.jpeg"
                alt="Royal Sparks FX"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-gold-300">ROYAL SPARKS FX</h3>
              <p className="text-[11px] text-neutral-400">All Modules & Tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-surface-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-5 py-3 bg-surface-card border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 text-gold-300 font-bold flex items-center justify-center border border-gold-500/30">
              {currentUser.full_name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">{currentUser.full_name}</div>
              <div className="text-[11px] text-neutral-400">{currentUser.email}</div>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gold-500/20 text-gold-300 border border-gold-500/30 uppercase tracking-wider">
            {currentUser.role}
          </span>
        </div>

        {/* Scrollable Navigation Options */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {menuItems.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                {group.title}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-gold-500/15 border-gold-500/40 text-gold-200 shadow-sm'
                          : 'bg-surface-card border-surface-border text-neutral-300 hover:bg-surface-hover hover:border-surface-border'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-gold-500 text-black'
                            : 'bg-surface-elevated text-gold-400 border border-gold-500/20'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold">{item.name}</div>
                        <div className="text-[11px] text-neutral-400 truncate">{item.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer / Logout */}
        <div className="p-4 border-t border-surface-border bg-surface flex items-center justify-between">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-gold-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
