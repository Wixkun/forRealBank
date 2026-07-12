'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { apiFetch } from '@/lib/api-client';

const inputClass =
  'w-full rounded-lg border border-edge-strong bg-input px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/60';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-1 rounded-2xl border border-edge p-5">
      <h2 className="text-fg text-sm font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Paramètres du compte : informations du profil (prénom / nom modifiables via
 * l'endpoint existant PATCH /users/me), langue de l'interface (fr / en, via le
 * segment de locale de l'URL) et apparence (thème sombre / clair, persisté en
 * localStorage par le ThemeContext).
 */
export function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const { user, isLoading, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<'saved' | 'error' | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const initials = ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || 'U';
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')
    : null;
  const profileChanged = firstName.trim() !== user.firstName || lastName.trim() !== user.lastName;

  const saveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      await refresh();
      setSaveMessage('saved');
    } catch {
      setSaveMessage('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Bascule fr ↔ en : remplace le segment de locale de l'URL en conservant le
  // reste du chemin et la query (le middleware next-intl fait le reste).
  const switchLocale = (next: 'fr' | 'en') => {
    if (next === locale) return;
    const segments = pathname.split('/');
    segments[1] = next;
    const qs = searchParams.toString();
    router.push(segments.join('/') + (qs ? `?${qs}` : ''));
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-fg mb-1">{t('title')}</h1>
        <p className="text-fg-muted text-sm">{t('subtitle')}</p>
      </div>

      {/* ── Profil ─────────────────────────────────────────────────────── */}
      <Section title={t('profile.title')}>
        <div className="flex items-start gap-4 mb-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white ring-1 ring-white/10">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-fg text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-fg-muted text-xs truncate">{user.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
              <span>
                {(user.roles ?? []).map((r) => t(`profile.roles.${r}` as never)).join(' · ')}
              </span>
              {createdAt && (
                <>
                  <span>·</span>
                  <span>{t('profile.memberSince', { date: createdAt })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-fg-muted text-xs mb-1.5" htmlFor="settings-firstname">
              {t('profile.firstName')}
            </label>
            <input
              id="settings-firstname"
              type="text"
              value={firstName}
              maxLength={100}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-fg-muted text-xs mb-1.5" htmlFor="settings-lastname">
              {t('profile.lastName')}
            </label>
            <input
              id="settings-lastname"
              type="text"
              value={lastName}
              maxLength={100}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void saveProfile()}
            disabled={isSaving || !profileChanged || !firstName.trim() || !lastName.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition disabled:opacity-50"
          >
            {isSaving ? t('profile.saving') : t('profile.save')}
          </button>
          {saveMessage === 'saved' && (
            <span className="text-xs text-tertiary">{t('profile.saved')}</span>
          )}
          {saveMessage === 'error' && (
            <span className="text-xs text-danger">{t('profile.error')}</span>
          )}
        </div>
      </Section>

      {/* ── Langue ─────────────────────────────────────────────────────── */}
      <Section title={t('language.title')}>
        <p className="text-fg-muted text-xs mb-3">{t('language.subtitle')}</p>
        <div
          className="grid grid-cols-2 gap-2 max-w-sm"
          role="radiogroup"
          aria-label={t('language.title')}
        >
          {(
            [
              { code: 'fr', label: 'Français', flag: '🇫🇷' },
              { code: 'en', label: 'English', flag: '🇬🇧' },
            ] as const
          ).map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="radio"
              aria-checked={locale === lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
                locale === lang.code
                  ? 'border-primary/40 bg-primary/15 text-tertiary'
                  : 'border-edge-strong bg-hover text-fg-secondary hover:bg-hover-strong'
              }`}
            >
              <span aria-hidden="true">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Apparence ──────────────────────────────────────────────────── */}
      <Section title={t('appearance.title')}>
        <p className="text-fg-muted text-xs mb-3">{t('appearance.subtitle')}</p>
        <div
          className="grid grid-cols-2 gap-2 max-w-sm"
          role="radiogroup"
          aria-label={t('appearance.title')}
        >
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'dark'}
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
              theme === 'dark'
                ? 'border-primary/40 bg-primary/15 text-tertiary'
                : 'border-edge-strong bg-hover text-fg-secondary hover:bg-hover-strong'
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            {t('appearance.dark')}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'light'}
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
              theme === 'light'
                ? 'border-primary/40 bg-primary/15 text-tertiary'
                : 'border-edge-strong bg-hover text-fg-secondary hover:bg-hover-strong'
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
            {t('appearance.light')}
          </button>
        </div>
      </Section>

      {/* ── Sécurité ───────────────────────────────────────────────────── */}
      <Section title={t('security.title')}>
        <p className="text-fg-muted text-xs mb-3">{t('security.subtitle')}</p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard/security`)}
          className="rounded-lg border border-edge-strong bg-hover px-4 py-2 text-xs font-semibold text-fg-secondary hover:bg-hover-strong transition"
        >
          {t('security.manage')}
        </button>
      </Section>
    </div>
  );
}
