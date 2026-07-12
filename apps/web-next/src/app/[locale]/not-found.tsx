'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ErrorPageTemplate } from '@/components/ui/ErrorPageTemplate';

export default function NotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('errors.404');

  return (
    <ErrorPageTemplate
      errorCode="404"
      title={t('title')}
      subtitle={t('subtitle')}
      description={t('description')}
      primaryButton={{
        text: t('backHome'),
        href: `/${locale}`,
      }}
      preferredAuthenticatedHomeHref={`/${locale}/dashboard`}
      secondaryButton={{
        text: t('backDashboard'),
        onClick: () => (window.location.href = `/${locale}/dashboard`),
      }}
      locale={locale}
      showLanguageSwitcher
    />
  );
}
