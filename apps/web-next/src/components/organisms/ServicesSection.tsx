import { ServiceCard } from '../molecules/ServiceCard';

type Service = {
  icon: 'shield' | 'chart' | 'globe' | 'lock' | 'wallet' | 'trending' | 'users' | 'check';
  title: string;
  description: string;
  features: string[];
};

type ServicesSectionProps = {
  title: string;
  subtitle: string;
  services: Service[];
};

export function ServicesSection({ title, subtitle, services }: ServicesSectionProps) {
  return (
    <section id="services" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-teal-100 to-cyan-200 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              features={service.features}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
