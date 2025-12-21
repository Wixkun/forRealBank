import { Icon } from '../ui/Icon';

type FeatureCardProps = {
  icon: 'shield' | 'chart' | 'globe' | 'lock' | 'wallet' | 'trending' | 'users' | 'check';
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative bg-gradient-to-br from-teal-950/50 to-cyan-950/30 backdrop-blur-sm rounded-xl p-8 border border-teal-500/20 hover:border-teal-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full group-hover:scale-110 transition-transform duration-300">
          <Icon name={icon} className="w-8 h-8 text-teal-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
