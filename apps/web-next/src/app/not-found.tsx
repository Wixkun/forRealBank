import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorPageTemplate } from '@/components/templates/ErrorPageTemplate';

export default function GlobalNotFound() {
  return (
    <ThemeProvider>
      <ErrorPageTemplate
        errorCode="404"
        title="404"
        subtitle="Page non trouvée"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        primaryButton={{
          text: "Retour à l'accueil",
          href: '/fr',
        }}
        locale="fr"
      />
    </ThemeProvider>
  );
}
