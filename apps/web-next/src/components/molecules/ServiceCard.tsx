import { Icon } from '../ui/Icon';

type ServiceCardProps = {
  icon: 'shield' | 'chart' | 'globe' | 'lock' | 'wallet' | 'trending' | 'users' | 'check';
  title: string;
  description: string;
  features: string[];
};

export function ServiceCard({ icon, title, description, features }: ServiceCardProps) {
  return (
    <div className="bg-gradient-to-br from-teal-900/30 to-cyan-900/20 backdrop-blur-sm rounded-2xl p-8 border border-teal-500/20 hover:border-teal-400/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/10">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
          <Icon name={icon} className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
      </div>
      
      <p className="text-gray-300 mb-6 leading-relaxed">{description}</p>
      
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Icon name="check" className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-400 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
