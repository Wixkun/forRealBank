import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nettoyage du DOM entre les tests.
afterEach(() => {
  cleanup();
});

// jsdom n'implémente pas scrollIntoView (utilisé par la vue de chat).
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// next-intl : `useTranslations(ns)` renvoie une fonction (key, vars) qui
// produit une chaîne stable et interpole les variables — suffisant pour
// asserter le rendu sans charger les fichiers de messages.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key} ${JSON.stringify(vars)}` : key,
  useLocale: () => 'fr',
}));

// ThemeContext : thème sombre par défaut dans les tests.
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn(), setTheme: vi.fn() }),
}));

// next/navigation : valeurs neutres.
vi.mock('next/navigation', () => ({
  usePathname: () => '/fr/dashboard/messages',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
