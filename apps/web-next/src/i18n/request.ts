import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: Locale =
    locales.includes(locale as Locale)
      ? (locale as Locale)
      : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`./${resolvedLocale}.json`)).default
  };
});
