'use client';
import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

function LoginForm() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locale = pathname.split('/')[1] || 'en';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          router.push(`/${locale}/dashboard`);
        }
      } catch {}
    };

    checkAuth();

    if (searchParams?.get('registered') === 'true') {
      setSuccessMessage(t('registrationSuccess'));
    }
    if (searchParams?.get('verified') === 'true') {
      setSuccessMessage(t('verificationSuccess'));
    }
  }, [searchParams, router, t, locale]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          ...(requiresTwoFactor ? { twoFactorCode } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = (data?.message || data?.error || '').toString();
        if (response.status === 428) {
          setRequiresTwoFactor(true);
          throw new Error(t('twoFactorPrompt'));
        }
        if (response.status === 403 && message.toLowerCase().includes('banned')) {
          if (typeof document !== 'undefined') {
            document.cookie = `is_banned=1; path=/; max-age=86400`;
          }
          router.replace(`/${locale}/banned`);
          return;
        }
        if (response.status === 403 && message.toLowerCase().includes('verified')) {
          throw new Error(t('emailNotVerified'));
        }
        if (response.status === 423) {
          throw new Error(t('accountLocked'));
        }
        if (response.status === 429) {
          throw new Error(t('tooManyAttempts'));
        }
        if (requiresTwoFactor && response.status === 401) {
          throw new Error(t('invalidTwoFactorCode'));
        }
        throw new Error(data.message || t('loginFailed'));
      }

      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 500);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-2 rounded-lg text-sm">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm mb-1 text-gray-200">{t('email')}</label>
          <input
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-hover-strong placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
        </div>

        {requiresTwoFactor && (
          <div>
            <label className="block text-sm mb-1 text-gray-200">{t('twoFactorLabel')}</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-2 rounded-lg bg-hover-strong placeholder-gray-300 tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-teal-400"
              autoFocus
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1 text-gray-200">{t('password')}</label>
          <input
            type="password"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-hover-strong placeholder-gray-300
              focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          <div className="text-right mt-1">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs text-teal-400 hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover transition
            text-white font-semibold py-2 rounded-lg shadow-lg
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('loading') : t('submit')}
        </button>

        <p className="text-center text-sm text-gray-300 mt-4">
          {tCommon('noAccountYet')}{' '}
          <Link href={`/${locale}/register`} className="text-teal-400 hover:underline">
            {tCommon('register')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center force-dark bg-surface-0">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
