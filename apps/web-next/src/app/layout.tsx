import './globals.css';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

// Pose data-theme avant la première peinture (anti-flash) : les tokens CSS
// [data-theme='light'] de globals.css s'appliquent immédiatement, le
// ThemeContext prend ensuite le relais côté React.
const themeInitScript = `try{document.documentElement.dataset.theme=localStorage.getItem('theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
