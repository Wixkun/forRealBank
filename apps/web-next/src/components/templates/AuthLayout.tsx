 'use client';

import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/organisms/LanguageSwitcher';

type AuthLayoutProps = {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800 
      bg-cover bg-center relative"
      style={{ backgroundImage: "url('/wallpaper.jpeg')" }}
    >
      <div className="absolute top-0 right-0 p-4 z-20">
        <LanguageSwitcher theme="dark" />
      </div>
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 text-white">
        <div className="mb-6">
          {title ?? (
            <h2
              className="text-4xl font-bold text-center 
              bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 
              bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]"
            >
              Avenir
            </h2>
          )}

          {subtitle ? (
            <div className="mt-2 text-center text-sm text-gray-200">
              {subtitle}
            </div>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}
