'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { buildApiUrl, BROWSER_API_BASE } from '@/lib/env';

function VerifyEmailContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split('/')[1] || 'fr';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const pageText = {
    title: locale === 'fr' ? "Verification de l'email" : 'Email verification',
    loading:
      locale === 'fr'
        ? 'Verification de votre adresse email...'
        : 'Verifying your email address...',
    success:
      locale === 'fr'
        ? 'Votre adresse email a bien ete confirmee. Redirection vers la connexion...'
        : 'Your email address has been confirmed. Redirecting to login...',
    failed:
      locale === 'fr'
        ? 'Le lien de verification est invalide ou expire.'
        : 'The verification link is invalid or expired.',
    missingToken:
      locale === 'fr'
        ? 'Le lien de verification est incomplet.'
        : 'The verification link is incomplete.',
    backToLogin: locale === 'fr' ? 'Retour a la connexion' : 'Back to login',
  };

  useEffect(() => {
    const token = searchParams?.get('token');
    if (!token) {
      setStatus('error');
      setMessage(pageText.missingToken);
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
          throw new Error(data?.message || pageText.failed);
        }

        setStatus('success');
        setMessage(pageText.success);
        setTimeout(() => {
          router.replace(`/${locale}/login?verified=true`);
        }, 1500);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : pageText.failed);
      }
    };

    void verifyEmail();
  }, [locale, pageText.failed, pageText.missingToken, pageText.success, router, searchParams]);

  return (
    <AuthLayout title={pageText.title}>
      <div className="space-y-4 text-center">
        {status === 'loading' && <p className="text-sm text-gray-200">{pageText.loading}</p>}
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
          {pageText.backToLogin}
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center force-dark bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800">
          <div className="text-fg">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
