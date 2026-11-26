'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useBusinessStore } from '@/lib/store';
import AppHeader from '@/components/layout/AppHeader';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth } = useBusinessStore();

  const isLoginPage = pathname === '/login';

  // Client-side direct URL protection
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated && !isLoginPage) {
        router.replace('/login');
      } else if (isAuthenticated && isLoginPage) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoadingAuth, isLoginPage, router]);

  // Loading Screen while verifying session
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4">
        <div className="relative w-28 h-28 mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <Image
            src="/assets/royal-sparks-fx-logo.jpeg"
            alt="Royal Sparks FX"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-2 text-gold-300 font-serif tracking-widest text-xs uppercase animate-pulse">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
          <span>Verifying Partner Session...</span>
        </div>
      </div>
    );
  }

  // If on Login page or not authenticated: Render ONLY the login screen (Requirement 7)
  if (isLoginPage || !isAuthenticated) {
    return (
      <main className="min-h-screen w-full flex flex-col justify-center items-center bg-black">
        {children}
      </main>
    );
  }

  // Authenticated Partner Interface: Render Full Layout
  return (
    <div className="flex min-h-screen w-full bg-black text-white antialiased">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <AppHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (Dashboard | Calculation | Calendar) */}
      <MobileBottomNav />
    </div>
  );
}
