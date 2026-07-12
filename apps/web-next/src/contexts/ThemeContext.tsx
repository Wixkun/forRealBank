'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  /**
   * Pins the theme and skips the localStorage/toggle sync. Used by surfaces
   * (e.g. the dashboard shell) that don't expose a theme switch yet and must
   * not inherit a stray preference saved by another page sharing the same
   * localStorage key. Drop this prop once that surface gets its own toggle.
   */
  forcedTheme?: Theme;
};

export function ThemeProvider({ children, forcedTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(forcedTheme ?? 'dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (forcedTheme) {
      setMounted(true);
      return;
    }
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, [forcedTheme]);

  // Les tokens CSS (surfaces, textes, bordures) sont redéfinis par le
  // sélecteur [data-theme='light'] de globals.css : poser l'attribut sur
  // <html> fait basculer toute l'application. Un script anti-flash dans le
  // layout racine pose la valeur initiale avant l'hydratation.
  useEffect(() => {
    document.documentElement.dataset.theme = forcedTheme ?? theme;
  }, [theme, forcedTheme]);

  const toggleTheme = () => {
    if (forcedTheme) return;
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: forcedTheme ?? theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
