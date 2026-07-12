'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { buildApiUrl, BROWSER_API_BASE } from '@/lib/env';

function VerifyEmailContent() {
  const t = useTranslations('auth.verifyEmail');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split('/')[1] || 'fr';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');
    if (!token) {
      setStatus('error');
      setMessage(t('missingToken'));
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(buildApiUrl(BROWSER_API_BASE, '/auth/verify-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || t('failed'));
        }

        setStatus('success');
        setMessage(t('success'));
        setTimeout(() => {
          router.replace(`/${locale}/login?verified=true`);
        }, 1500);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : t('failed'));
      }
    };

    void verifyEmail();
  }, [locale, router, searchParams, t]);

  return (
    <AuthLayout title={t('title')} wallpaper="/verif_mail_wallpaper.png">
      <div className="space-y-4 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-gray-200">{t('loading')}</p>
          </div>
        )}
        {status !== 'loading' && (
          <div
            className={`px-4 py-3 rounded-lg text-sm border ${
              status === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-200'
                : 'bg-red-500/20 border-red-500/50 text-red-200'
            }`}
          >
            {message}
          </div>
        )}
        <Link href={`/${locale}/login`} className="text-teal-400 hover:underline text-sm">
          {t('backToLogin')}
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center force-dark bg-surface-0">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
