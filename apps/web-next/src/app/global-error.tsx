'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorPageTemplate } from '@/components/templates/ErrorPageTemplate';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <ThemeProvider>
          <ErrorPageTemplate
            errorCode="500"
            title="500"
            subtitle="Erreur serveur"
            description="Une erreur inattendue s'est produite. Notre équipe a été notifiée et travaille dessus."
            primaryButton={{
              text: "Retour à l'accueil",
              href: '/fr',
            }}
            secondaryButton={{
              text: 'Réessayer',
              onClick: reset,
            }}
            locale="fr"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
