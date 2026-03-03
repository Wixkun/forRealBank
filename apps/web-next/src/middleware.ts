import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || defaultLocale;

  const isBanned = request.cookies.get('is_banned')?.value === '1';
  if (isBanned) {
    const isAllowed =
      pathname === `/${locale}` ||
      pathname === `/${locale}/` ||
      pathname.startsWith(`/${locale}/banned`);

    if (!isAllowed) {
      return NextResponse.redirect(new URL(`/${locale}/banned`, request.url));
    }
  }

  if (
    pathname === `/${locale}/news` ||
    pathname.startsWith(`/${locale}/news/manage`) ||
    pathname === `/${locale}/notifications` ||
    pathname.startsWith(`/${locale}/news/create`)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
