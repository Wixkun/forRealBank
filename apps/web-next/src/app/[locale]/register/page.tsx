import { getTranslations } from 'next-intl/server';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.register' });
  return {
    title: t('title'),
    robots: 'noindex',
  };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.register' });

  return (
    <AuthLayout title={t('title')}>
      <RegisterForm />
    </AuthLayout>
  );
}
