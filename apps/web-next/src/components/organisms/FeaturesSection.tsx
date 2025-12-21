import { FeatureCard } from '../molecules/FeatureCard';

type Feature = {
  icon: 'shield' | 'chart' | 'globe' | 'lock' | 'wallet' | 'trending' | 'users' | 'check';
  title: string;
  description: string;
};

type FeaturesSectionProps = {
  title: string;
  subtitle: string;
  features: Feature[];
};

export function FeaturesSection({ title, subtitle, features }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-24 px-4 bg-gradient-to-b from-transparent via-teal-950/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-teal-100 to-cyan-200 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
