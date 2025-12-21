'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorPageTemplate } from '@/components/templates/ErrorPageTemplate';
import { useParams, useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('errors.500');
  const router = useRouter();

  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <ThemeProvider>
      <ErrorPageTemplate
        errorCode="500"
        title={t('title')}
        subtitle={t('subtitle')}
        description={t('description')}
        primaryButton={{
          text: t('backHome'),
          href: `/${locale}`,
        }}
        secondaryButton={{
          text: t('tryAgain'),
          onClick: () => {
            reset();
            router.refresh();
          },
        }}
        locale={locale}
      />
    </ThemeProvider>
  );
}
