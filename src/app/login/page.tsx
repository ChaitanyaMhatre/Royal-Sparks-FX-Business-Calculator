'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBusinessStore, INITIAL_MEMBERS } from '@/lib/store';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useBusinessStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your partner email address.');
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success('Welcome back to Royal Sparks FX!');
        router.replace('/');
      } else {
        toast.error(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPartner = (partnerEmail: string) => {
    setEmail(partnerEmail);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-black">
      <div className="w-full max-w-md space-y-6 animate-in fade-in duration-300">
        {/* Brand Header with Official Logo */}
        <div className="text-center space-y-3">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto drop-shadow-[0_0_30px_rgba(212,175,55,0.45)]">
            <Image
              src="/assets/royal-sparks-fx-logo.jpeg"
              alt="Royal Sparks FX"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-widest uppercase">
              ROYAL SPARKS FX
            </h1>
            <p className="text-xs text-gold-400 font-medium tracking-wide">
              Celebrating Your Special Moments
            </p>
            <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold pt-1">
              Business Manager • Partner Login
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-surface-card border border-gold-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-semibold block">
                Partner Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@royalsparksfx.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-neutral-300 font-semibold">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter partner password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs focus:outline-none focus:border-gold-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black shadow-gold hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Business Manager</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Partner Account Selection */}
          <div className="pt-4 border-t border-surface-border space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider text-center">
              Authorized Business Partners
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {INITIAL_MEMBERS.map((member, idx) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelectPartner(member.email)}
                  className={`py-2 px-1 rounded-xl text-center font-semibold border transition-all truncate ${
                    email.toLowerCase() === member.email.toLowerCase()
                      ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
                      : 'bg-surface-elevated hover:bg-surface-hover text-neutral-300 border-surface-border'
                  }`}
                  title={member.full_name + ' (' + member.email + ')'}
                >
                  Member {idx + 1}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center text-neutral-500 pt-1">
              Tap a member above to auto-fill their authorized email
            </p>
          </div>

          {/* Security Notice: Strict Requirement 4 */}
          <div className="pt-3 border-t border-surface-border/50 flex items-center justify-center gap-2 text-[10px] text-neutral-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <span>Private centralized platform. Public registration disabled.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
