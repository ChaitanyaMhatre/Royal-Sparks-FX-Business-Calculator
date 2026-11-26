'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useBusinessStore();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginId.trim() || !password.trim()) {
      toast.error('Please enter both Login ID and Password');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(loginId, password);

      if (res.success) {
        toast.success('Welcome back to Royal Sparks FX!');
        router.replace('/');
      } else {
        toast.error(res.error || 'Invalid credentials. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error('An unexpected error occurred during login.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-surface text-neutral-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
            <Image
              src="/assets/royal-sparks-fx-logo.jpeg"
              alt="Royal Sparks FX"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-widest">
              ROYAL SPARKS FX
            </h1>
            <p className="text-xs text-gold-300 font-medium tracking-wide mt-1">
              Celebrating Your Special Moments
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-[11px] text-gold-300">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
            <span>Central Business Portal • 3 Partners</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-surface-card border border-gold-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-surface-border pb-3">
            <h2 className="text-base font-semibold text-white">Business Login</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Enter your shared partner credentials to access the central manager.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Login ID Input */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-semibold block text-xs">
                Login ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter Login ID (e.g. royalsparks)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-neutral-300 font-semibold block text-xs">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast.info('Contact Royal Sparks FX administration for shared credentials.')
                  }
                  className="text-[11px] text-gold-400 hover:underline"
                >
                  Need Help?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-black shadow-gold hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure Partner Notice */}
          <div className="pt-3 border-t border-surface-border text-center">
            <p className="text-[11px] text-neutral-400">
              Shared database is automatically synchronized across all three partners&apos; devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
