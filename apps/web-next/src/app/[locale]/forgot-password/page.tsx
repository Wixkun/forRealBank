'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { buildApiUrl, BROWSER_API_BASE } from '@/lib/env';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl(BROWSER_API_BASE, '/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || t('genericError'));
      }

      setMessage(t('successMessage'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('title')} subtitle={t('subtitle')} wallpaper="/error_wallpaper.png">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm mb-1 text-gray-200" htmlFor="forgot-email">
            {t('email')}
          </label>
          <input
            id="forgot-email"
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-hover-strong placeholder-gray-300
              focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover transition
            text-white font-semibold py-2 rounded-lg shadow-lg
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('sending') : t('submit')}
        </button>

        <p className="text-center text-sm text-gray-300 mt-4">
          {t('rememberedPassword')}{' '}
          <Link href={`/${locale}/login`} className="text-teal-400 hover:underline">
            {t('backToLogin')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
