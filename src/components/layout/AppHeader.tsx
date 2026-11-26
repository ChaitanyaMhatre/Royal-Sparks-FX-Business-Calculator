'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBusinessStore } from '@/lib/store';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  ShieldCheck,
  ChevronDown,
  Database,
  Calendar,
  DollarSign,
  PlusCircle,
} from 'lucide-react';

export default function AppHeader() {
  const { currentUser, switchUser, syncStatus, isSupabaseLive, refreshData } = useBusinessStore();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-md border border-gold-500/30 group-hover:border-gold-500 transition-colors bg-surface-card">
            <Image
              src="/assets/royal-sparks-fx-logo.jpeg"
              alt="Royal Sparks FX"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif tracking-wider font-bold text-sm sm:text-base text-gold-300 group-hover:text-gold-200 transition-colors">
              ROYAL SPARKS FX
            </span>
            <span className="text-[10px] text-neutral-400 hidden sm:block tracking-wide">
              Celebrating Your Special Moments
            </span>
          </div>
        </Link>

        {/* Right Action Area */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Real-time Sync Status Indicator */}
          <button
            onClick={() => refreshData()}
            title="Click to refresh and sync with cloud"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-surface-card border border-surface-border hover:border-gold-500/50 hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            {syncStatus === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-medium hidden xs:inline text-[11px]">
                  {isSupabaseLive ? 'Cloud Realtime' : 'Central Sync'}
                </span>
                <RefreshCw className="w-2.5 h-2.5 text-neutral-500 hover:text-gold-400 ml-0.5" />
              </>
            )}
            {syncStatus === 'synchronizing' && (
              <>
                <RefreshCw className="w-3 h-3 text-gold-400 animate-spin" />
                <span className="text-gold-300 font-medium hidden xs:inline text-[11px]">Syncing</span>
              </>
            )}
            {syncStatus === 'offline' && (
              <>
                <WifiOff className="w-3 h-3 text-neutral-500" />
                <span className="text-neutral-400 hidden xs:inline text-[11px]">Offline</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 hidden xs:inline text-[11px]">Sync Failed</span>
              </>
            )}
          </button>

          {/* Quick Member Switching Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-card hover:bg-surface-elevated border border-surface-border transition-all text-xs"
              title="Switch Active Business Member"
            >
              <div className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-300 flex items-center justify-center font-bold text-[11px] border border-gold-500/30">
                {currentUser.role === 'admin' ? 'A' : 'M'}
              </div>
              <div className="flex flex-col text-left hidden md:block">
                <span className="text-neutral-200 font-medium text-[11px] leading-tight line-clamp-1">
                  {currentUser.full_name.split(' (')[0]}
                </span>
                <span className="text-[9px] text-gold-400 uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Member Switcher Dropdown */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 bg-surface-elevated border border-gold-500/30 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-surface-border mb-1">
                  <p className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold">
                    Royal Sparks FX Members
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Select a member to test real-time multi-user changes
                  </p>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => switchUser('u0000000-0000-0000-0000-000000000001')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      currentUser.id === 'u0000000-0000-0000-0000-000000000001'
                        ? 'bg-gold-500/20 text-gold-200 border border-gold-500/40'
                        : 'hover:bg-surface-card text-neutral-300'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gold-500/30 text-gold-300 flex items-center justify-center font-bold text-[10px]">
                      1
                    </div>
                    <div>
                      <div className="font-medium">Member 1 (Admin)</div>
                      <div className="text-[10px] text-neutral-400">admin@royalsparksfx.com</div>
                    </div>
                  </button>

                  <button
                    onClick={() => switchUser('u0000000-0000-0000-0000-000000000002')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      currentUser.id === 'u0000000-0000-0000-0000-000000000002'
                        ? 'bg-gold-500/20 text-gold-200 border border-gold-500/40'
                        : 'hover:bg-surface-card text-neutral-300'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gold-500/30 text-gold-300 flex items-center justify-center font-bold text-[10px]">
                      2
                    </div>
                    <div>
                      <div className="font-medium">Member 2 (Operations)</div>
                      <div className="text-[10px] text-neutral-400">operations@royalsparksfx.com</div>
                    </div>
                  </button>

                  <button
                    onClick={() => switchUser('u0000000-0000-0000-0000-000000000003')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      currentUser.id === 'u0000000-0000-0000-0000-000000000003'
                        ? 'bg-gold-500/20 text-gold-200 border border-gold-500/40'
                        : 'hover:bg-surface-card text-neutral-300'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gold-500/30 text-gold-300 flex items-center justify-center font-bold text-[10px]">
                      3
                    </div>
                    <div>
                      <div className="font-medium">Member 3 (Finance)</div>
                      <div className="text-[10px] text-neutral-400">finance@royalsparksfx.com</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
