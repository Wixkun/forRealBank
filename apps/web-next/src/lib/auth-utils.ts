export function extractLocaleFromPathname(pathname: string): string {
  const seg = (pathname || '').split('/')[1];
  if (seg === 'fr' || seg === 'en') return seg;
  return 'en';
}
