import { getTranslations } from 'next-intl/server';
import { HeroSection } from '@/features/landing/components/HeroSection';
import { FeaturesSection } from '@/features/landing/components/FeaturesSection';
import { ServicesSection } from '@/features/landing/components/ServicesSection';
import { CTASection } from '@/features/landing/components/CTASection';
import Header from '@/components/layout/Header';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'home' });

  const features = [
    {
      icon: 'shield' as const,
      title: t('features.items.security.title'),
      description: t('features.items.security.description'),
    },
    {
      icon: 'trending' as const,
      title: t('features.items.trading.title'),
      description: t('features.items.trading.description'),
    },
    {
      icon: 'globe' as const,
      title: t('features.items.global.title'),
      description: t('features.items.global.description'),
    },
    {
      icon: 'lock' as const,
      title: t('features.items.protection.title'),
      description: t('features.items.protection.description'),
    },
  ];

  const services = [
    {
      icon: 'wallet' as const,
      title: t('services.banking.title'),
      description: t('services.banking.description'),
      features: [
        t('services.banking.features.cards'),
        t('services.banking.features.transfers'),
        t('services.banking.features.savings'),
        t('services.banking.features.loans'),
      ],
    },
    {
      icon: 'chart' as const,
      title: t('services.trading.title'),
      description: t('services.trading.description'),
      features: [
        t('services.trading.features.markets'),
        t('services.trading.features.analysis'),
        t('services.trading.features.mobile'),
        t('services.trading.features.education'),
      ],
    },
    {
      icon: 'trending' as const,
      title: t('services.wealth.title'),
      description: t('services.wealth.description'),
      features: [
        t('services.wealth.features.advisory'),
        t('services.wealth.features.portfolio'),
        t('services.wealth.features.tax'),
        t('services.wealth.features.estate'),
      ],
    },
    {
      icon: 'users' as const,
      title: t('services.business.title'),
      description: t('services.business.description'),
      features: [
        t('services.business.features.accounts'),
        t('services.business.features.payments'),
        t('services.business.features.cashflow'),
        t('services.business.features.financing'),
      ],
    },
  ];

  return (
    <>
      <Header />
      <main className="force-dark relative min-h-screen bg-surface-0 text-fg overflow-hidden">
        <HeroSection />

        <FeaturesSection
          title={t('features.title')}
          subtitle={t('features.subtitle')}
          features={features}
        />

        <ServicesSection
          title={t('services.title')}
          subtitle={t('services.subtitle')}
          services={services}
        />

        <CTASection
          title={t('cta.title')}
          description={t('cta.description')}
          buttonText={t('cta.button')}
          locale={locale}
        />
      </main>
    </>
  );
}
