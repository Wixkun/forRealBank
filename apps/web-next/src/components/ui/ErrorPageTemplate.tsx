'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

type ErrorPageTemplateProps = {
  errorCode: '404' | '500';
  title: string;
  subtitle: string;
  description: string;
  primaryButton: {
    text: string;
    href: string;
  };
  secondaryButton?: {
    text: string;
    onClick?: () => void;
  };
  locale: string;
  preferredAuthenticatedHomeHref?: string;
  /**
   * Le sélecteur de langue nécessite le contexte next-intl : à activer
   * uniquement depuis les pages sous [locale] (pas depuis global-error /
   * not-found racine, rendus hors provider).
   */
  showLanguageSwitcher?: boolean;
};

/**
 * Gabarit des pages d'erreur (404 / 500) : wallpaper « error » plein écran,
 * voile de lisibilité, code en dégradé teal, marque ForRealBank et actions.
 */
export function ErrorPageTemplate({
  errorCode,
  title,
  subtitle,
  description,
  primaryButton,
  secondaryButton,
  locale,
  preferredAuthenticatedHomeHref,
  showLanguageSwitcher = false,
}: ErrorPageTemplateProps) {
  const { isAuthenticated } = useAuth();

  const effectivePrimaryHref =
    isAuthenticated && preferredAuthenticatedHomeHref
      ? preferredAuthenticatedHomeHref
      : primaryButton.href;

  return (
    <div
      className="min-h-screen relative force-dark bg-surface-0 bg-cover bg-center"
      style={{ backgroundImage: "url('/error_wallpaper.png')" }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/40" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-lg bg-primary ring-1 ring-white/15 flex items-center justify-center text-sm font-bold text-white shrink-0">
            FR
          </span>
          <span className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors">
            ForRealBank
          </span>
        </Link>
        {showLanguageSwitcher && <LanguageSwitcher theme="dark" />}
      </header>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full text-center rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl px-8 py-12">
          <div className="relative mb-6">
            <h1
              className="text-[120px] sm:text-[150px] font-bold leading-none select-none bg-linear-to-r from-teal-300 to-teal-500 bg-clip-text text-transparent"
              style={{ textShadow: '0 0 80px rgba(45, 212, 191, 0.3)' }}
            >
              {title}
            </h1>
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl bg-teal-500/20" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl bg-primary/20" />
          </div>

          <h2 className="text-3xl font-semibold mb-4 text-white">{subtitle}</h2>

          <p className="text-lg mb-8 max-w-md mx-auto text-gray-300">{description}</p>

          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 bg-white/5 border-teal-500/30">
              <span className="text-4xl" aria-hidden="true">
                {errorCode === '404' ? '🔍' : '⚠️'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={effectivePrimaryHref}
              className="px-8 py-3 rounded-full font-medium transition-all shadow-lg bg-primary hover:bg-primary-hover text-white"
            >
              {primaryButton.text}
            </Link>

            {secondaryButton && (
              <button
                onClick={secondaryButton.onClick}
                className="px-8 py-3 rounded-full font-medium transition-all border border-white/20 text-gray-200 hover:bg-white/10"
              >
                {secondaryButton.text}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
