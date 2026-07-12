'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

type AuthLayoutProps = {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Fond plein écran (fichier de public/). */
  wallpaper?: string;
};

/**
 * Gabarit commun des pages hors dashboard (login, register, mot de passe,
 * vérification email) : wallpaper plein écran + voile de lisibilité, marque
 * ForRealBank en haut à gauche (retour à l'accueil), sélecteur de langue en
 * haut à droite, carte « verre » centrée.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  wallpaper = '/login_register_wallapper.png',
}: AuthLayoutProps) {
  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'en';

  return (
    <div
      className="min-h-screen relative force-dark bg-surface-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${wallpaper}')` }}
    >
      {/* Voile : garantit la lisibilité quel que soit le wallpaper. */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/35" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-lg bg-primary ring-1 ring-white/15 flex items-center justify-center text-sm font-bold text-white shrink-0">
            FR
          </span>
          <span className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors">
            ForRealBank
          </span>
        </Link>
        <LanguageSwitcher theme="dark" />
      </header>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-8 text-fg">
          {(title || subtitle) && (
            <div className="mb-6 text-center">
              {title && <h1 className="text-2xl font-semibold text-white">{title}</h1>}
              {subtitle && <p className="mt-2 text-sm text-gray-300">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
