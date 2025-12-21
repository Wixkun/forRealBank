'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorPageTemplate } from '@/components/templates/ErrorPageTemplate';

export default function NotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('errors.404');

  return (
    <ThemeProvider>
      <ErrorPageTemplate
        errorCode="404"
        title={t('title')}
        subtitle={t('subtitle')}
        description={t('description')}
        primaryButton={{
          text: t('backHome'),
          href: `/${locale}`,
        }}
        secondaryButton={{
          text: t('backDashboard'),
          onClick: () => (window.location.href = `/${locale}/dashboard`),
        }}
        locale={locale}
      />
    </ThemeProvider>
  );
}
