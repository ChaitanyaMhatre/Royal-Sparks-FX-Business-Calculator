'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import AppHeader from '@/components/layout/AppHeader';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { RefreshCw } from 'lucide-react';

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth } = useBusinessStore();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated && !isLoginPage) {
        router.replace('/login');
      } else if (isAuthenticated && isLoginPage) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoadingAuth, isLoginPage, router]);

  // Initial authentication loading splash screen
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
          <div className="relative w-32 h-32 drop-shadow-[0_0_25px_rgba(212,175,55,0.35)]">
            <Image
              src="/assets/royal-sparks-fx-logo.jpeg"
              alt="Royal Sparks FX"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-400" />
            <span>Loading Royal Sparks FX...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in and on the login page: render login page alone (clean full screen)
  if (!isAuthenticated) {
    if (isLoginPage) {
      return (
        <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4">
          {children}
        </div>
      );
    }
    // Redirecting to login
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-gold-400 animate-spin" />
      </div>
    );
  }

  // Authenticated: if on login page, wait for redirect
  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-gold-400 animate-spin" />
      </div>
    );
  }

  // Authenticated: Render full application with Sidebar, Header and Mobile Nav
  return (
    <div className="min-h-screen w-full flex bg-black text-white">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <AppHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
