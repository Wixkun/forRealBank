'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ErrorPageTemplate } from '@/components/ui/ErrorPageTemplate';

export default function BannedPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('banned');

  return (
    <ErrorPageTemplate
      errorCode="500"
      title={t('code')}
      subtitle={t('subtitle')}
      description={t('description')}
      primaryButton={{ text: t('primaryCta'), href: `/${locale}/login` }}
      locale={locale}
      showLanguageSwitcher
    />
  );
}
