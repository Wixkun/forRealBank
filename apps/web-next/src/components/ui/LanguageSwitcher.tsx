'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

type LanguageSwitcherProps = {
  theme?: 'light' | 'dark';
};

export function LanguageSwitcher({ theme = 'dark' }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;

    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPathname = segments.join('/');

    router.push(newPathname);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLanguageChange('fr')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          locale === 'fr'
            ? theme === 'dark'
              ? 'bg-primary/15 text-tertiary border border-primary/40'
              : 'bg-primary text-white'
            : theme === 'dark'
              ? 'text-fg-muted hover:text-fg-secondary'
              : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="Français"
      >
        FR
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          locale === 'en'
            ? theme === 'dark'
              ? 'bg-primary/15 text-tertiary border border-primary/40'
              : 'bg-primary text-white'
            : theme === 'dark'
              ? 'text-fg-muted hover:text-fg-secondary'
              : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
