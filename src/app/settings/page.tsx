'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useBusinessStore } from '@/lib/store';
import { formatINR } from '@/lib/formatters';
import {
  Settings,
  Building2,
  User,
  ShieldCheck,
  Save,
  CheckCircle,
  Smartphone,
  Database,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { currentUser, openingBalance, updateOpeningBalance, isSupabaseLive } = useBusinessStore();

  const [businessName, setBusinessName] = useState('Royal Sparks FX');
  const [tagline, setTagline] = useState('Celebrating Your Special Moments');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('contact@royalsparksfx.com');
  const [cashBalance, setCashBalance] = useState<number>(openingBalance);

  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      toast.error('Only Admin has permission to modify Business Settings');
      return;
    }
    await updateOpeningBalance(cashBalance);
    toast.success('Business preferences successfully saved!');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
          Platform & Business Settings
        </h1>
        <p className="text-xs text-neutral-400">
          Configure business profile, partner permissions, branding & financial defaults
        </p>
      </div>

      {/* Official Branding Card */}
      <div className="bg-surface-card border border-gold-500/30 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-gold-500/40 bg-black shrink-0 shadow-gold">
            <Image
              src="/assets/royal-sparks-fx-logo.jpeg"
              alt="Royal Sparks FX Official Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-bold font-serif text-gold-300">
              ROYAL SPARKS FX OFFICIAL BRANDING
            </h2>
            <p className="text-xs text-neutral-300">
              Tagline: &quot;Celebrating Your Special Moments&quot;
            </p>
            <p className="text-[11px] text-neutral-400">
              The official golden crown and typography logo is integrated across the PWA, loading screen, PDF exports, and dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Business Details Form */}
      <form onSubmit={handleSaveBusinessSettings} className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-border pb-3">
          <Building2 className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
            Business Profile & Defaults
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">Business Currency</label>
            <input
              type="text"
              disabled
              value="INR (Indian Rupee - ₹)"
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-neutral-400 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold block">Opening Cash Balance (₹)</label>
            <input
              type="number"
              value={cashBalance}
              disabled={currentUser.role !== 'admin'}
              onChange={(e) => setCashBalance(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-gold-300 font-bold text-xs disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-surface-border">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 to-gold-400 text-black shadow-gold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Business Preferences</span>
          </button>
        </div>
      </form>

      {/* User Profiles & 3 Members Section */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-border pb-3">
          <User className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
            Business Members & Role-Based Access
          </h3>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Member 1', role: 'Admin', email: 'admin@royalsparksfx.com', desc: 'Full business management, opening balance & user controls' },
            { name: 'Member 2', role: 'Member', email: 'operations@royalsparksfx.com', desc: 'Create events, add material expenses, manage equipment' },
            { name: 'Member 3', role: 'Member', email: 'finance@royalsparksfx.com', desc: 'Client collections, additional expenses, reports & cash flow' },
          ].map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-300 font-bold flex items-center justify-center border border-gold-500/30">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-white">{m.name}</div>
                  <div className="text-[11px] text-neutral-400">{m.email}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{m.desc}</div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-surface border border-gold-500/30 text-gold-300 self-start sm:self-auto">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase PostgreSQL & Cloud Realtime Connection Status */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 border-b border-surface-border pb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
            Database & Synchronization Engine
          </h3>
        </div>

        <div className="text-xs space-y-2 text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isSupabaseLive
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-gold-500/20 text-gold-300'
              }`}
            >
              {isSupabaseLive ? 'Connected to Supabase PostgreSQL' : 'Local High-Speed Central Sync Active'}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            The system includes full Supabase SQL migrations in <code className="text-gold-300">supabase/migrations/001_initial_schema.sql</code>. To connect your hosted Supabase Cloud database, add your <code className="text-gold-300">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-gold-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> into <code className="text-gold-300">.env.local</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
