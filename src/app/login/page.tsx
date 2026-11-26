'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useBusinessStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      // Find matching user or default to Member 1
      if (email.includes('operations')) {
        switchUser('u0000000-0000-0000-0000-000000000002');
      } else if (email.includes('finance')) {
        switchUser('u0000000-0000-0000-0000-000000000003');
      } else {
        switchUser('u0000000-0000-0000-0000-000000000001');
      }

      toast.success('Welcome back to Royal Sparks FX!');
      router.push('/');
    }, 400);
  };

  const handleQuickLogin = (id: string, name: string) => {
    switchUser(id);
    toast.success(`Logged in as ${name}`);
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-36 h-36 mx-auto drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
            <Image
              src="/assets/royal-sparks-fx-logo.jpeg"
              alt="Royal Sparks FX"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wider">
            BUSINESS MANAGER
          </h1>
          <p className="text-xs text-gold-300">
            Celebrating Your Special Moments
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-card border border-gold-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-semibold block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@royalsparksfx.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-neutral-300 font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => toast.info('Please contact your Royal Sparks FX administrator to reset credentials.')}
                  className="text-[11px] text-gold-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black shadow-gold hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Member Login Buttons */}
          <div className="pt-4 border-t border-surface-border space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider text-center">
              Quick Member Access (3 Partners)
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('u0000000-0000-0000-0000-000000000001', 'Member 1 (Admin)')
                }
                className="py-2 px-1 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-gold-500/30 text-gold-300 font-semibold text-center truncate"
              >
                Member 1
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('u0000000-0000-0000-0000-000000000002', 'Member 2 (Ops)')
                }
                className="py-2 px-1 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-neutral-200 font-semibold text-center truncate"
              >
                Member 2
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('u0000000-0000-0000-0000-000000000003', 'Member 3 (Finance)')
                }
                className="py-2 px-1 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-neutral-200 font-semibold text-center truncate"
              >
                Member 3
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
