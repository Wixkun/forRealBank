'use client';
import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/templates/AuthLayout';

function LoginForm() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locale = pathname.split('/')[1] || 'en';

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push(`/${locale}/dashboard`);
        }
      } catch {
        // User is not authenticated, stay on login page
      }
    };
    
    checkAuth();
    
    if (searchParams?.get('registered') === 'true') {
      setSuccessMessage(t('registrationSuccess'));
    }
  }, [searchParams, router, locale, t]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('loginFailed'));
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token || 'authenticated');
      }
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 500);
    } catch (err: unknown) {
      console.error('❌ Login error:', err);
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
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-200">{t('password')}</label>
            <input
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 
            hover:from-teal-400 hover:to-cyan-500 transition 
            text-white font-semibold py-2 rounded-lg shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('loading') : t('submit')}
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            {tCommon('alreadyHaveAccount')} {' '}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
