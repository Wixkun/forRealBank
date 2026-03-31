'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorPageTemplate } from '@/components/templates/ErrorPageTemplate';
import { useTranslations } from 'next-intl';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors.500');

  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <ThemeProvider>
          <ErrorPageTemplate
            errorCode="500"
            title={t('title')}
            subtitle={t('subtitle')}
            description={t('description')}
            primaryButton={{
              text: t('backHome'),
              href: '/fr',
            }}
            preferredAuthenticatedHomeHref={'/fr/dashboard'}
            secondaryButton={{
              text: t('tryAgain'),
              onClick: reset,
            }}
            locale="fr"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
