'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
  isInitial?: boolean;
}

export default function LoadingScreen({
  message = 'Preparing Your Business Dashboard',
  isInitial = false,
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Subtle Golden Glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />

        {/* Official Royal Sparks FX Logo */}
        <div className="relative mb-6 drop-shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-transform duration-700 ease-out">
          <Image
            src="/assets/royal-sparks-fx-logo.jpeg"
            alt="Royal Sparks FX"
            width={280}
            height={280}
            className="w-48 sm:w-60 h-auto object-contain"
            priority
          />
        </div>

        {/* Small Animated Golden Spinner */}
        <div className="relative flex items-center justify-center w-8 h-8 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-gold-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-500 animate-spin" />
          <div className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
        </div>

        {/* Loading text */}
        <p className="text-sm font-medium tracking-wider text-gold-300 uppercase">
          {message}
        </p>

        {isInitial && (
          <p className="text-xs text-neutral-500 mt-2">
            Centralized Business, Events & Finance Hub
          </p>
        )}
      </div>
    </div>
  );
}
