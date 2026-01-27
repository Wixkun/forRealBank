import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorPageTemplate } from '@/components/templates/ErrorPageTemplate';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/i18n/config';

export default async function GlobalNotFound() {
  const locale = defaultLocale;
  const t = await getTranslations({ locale, namespace: 'errors.404' });

  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.has('access_token');

  const preferredAuthenticatedHomeHref = hasAuthCookie ? `/${locale}/dashboard` : undefined;

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
        preferredAuthenticatedHomeHref={preferredAuthenticatedHomeHref}
        locale={locale}
      />
    </ThemeProvider>
  );
}
