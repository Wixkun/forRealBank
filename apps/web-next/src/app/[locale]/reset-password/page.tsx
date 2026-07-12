'use client';
import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { buildApiUrl, BROWSER_API_BASE } from '@/lib/env';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(BROWSER_API_BASE, '/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || t('genericError'));
      }

      setMessage(t('successMessage'));
      setTimeout(() => router.push(`/${locale}/login`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('title')} subtitle={t('subtitle')} wallpaper="/error_wallpaper.png">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!token && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm">
            {t('invalidLink')}
          </div>
        )}
        {message && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-2 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm mb-1 text-gray-200" htmlFor="reset-password">
            {t('newPassword')}
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-hover-strong placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
            minLength={12}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-200" htmlFor="reset-confirm-password">
            {t('confirmPassword')}
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-hover-strong placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
            minLength={12}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-primary hover:bg-primary-hover transition text-white font-semibold py-2 rounded-lg shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('loading') : t('submit')}
        </button>

        <p className="text-center text-sm text-gray-300 mt-4">
          <Link href={`/${locale}/login`} className="text-teal-400 hover:underline">
            {t('backToLogin')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center force-dark bg-surface-0">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
