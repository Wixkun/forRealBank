import { ErrorPageTemplate } from '@/components/ui/ErrorPageTemplate';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/i18n/config';

// Rendu hors du provider next-intl client ([locale] layout) : les textes sont
// traduits côté serveur et le sélecteur de langue reste désactivé.
export default async function GlobalNotFound() {
  const locale = defaultLocale;
  const t = await getTranslations({ locale, namespace: 'errors.404' });

  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.has('access_token');

  const preferredAuthenticatedHomeHref = hasAuthCookie ? `/${locale}/dashboard` : undefined;

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
      preferredAuthenticatedHomeHref={preferredAuthenticatedHomeHref}
      locale={locale}
    />
  );
}
