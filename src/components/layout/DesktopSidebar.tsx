'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import { LayoutDashboard, Calculator, Calendar, ChevronRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function DesktopSidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useBusinessStore();

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Calculation', href: '/calculation', icon: Calculator },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-surface-border h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-surface-border">
        <Link href="/" className="flex flex-col items-center text-center group">
          <div className="relative w-32 h-20 mb-2 drop-shadow-[0_0_15px_rgba(212,175,55,0.25)] group-hover:scale-105 transition-transform">
            <Image
              src="/assets/royal-sparks-fx-logo.jpeg"
              alt="Royal Sparks FX"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-serif font-bold text-xs tracking-wider text-gold-300">
            BUSINESS MANAGER
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            Celebrating Your Special Moments
          </span>
        </Link>
      </div>

      {/* Navigation Links - Exactly 3 Primary Pages */}
      <div className="flex-1 px-4 py-6 space-y-2">
        <p className="px-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Main Navigation
        </p>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href === '/calculation' &&
              (pathname.startsWith('/calculation') ||
                pathname.startsWith('/calculate') ||
                pathname.startsWith('/events')));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/10 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-surface-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-neutral-400'}`} />
                <span>{link.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-gold-400" />}
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-surface-border bg-surface-card/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gold-500/20 text-gold-300 font-bold flex items-center justify-center border border-gold-500/40 text-xs shrink-0">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.full_name.split(' (')[0]}
              </div>
              <div className="text-[10px] text-gold-400 font-medium uppercase tracking-wider">
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              toast.info('Signing out...');
              logout();
            }}
            title="Sign Out"
            className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
