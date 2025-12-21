'use client';

import { useTheme } from '@/contexts/ThemeContext';

type QuickActionButtonProps = {
  icon: string;
  label: string;
  variant: 'teal' | 'cyan' | 'gray';
  onClick?: () => void;
};

const variantStyles = {
  teal: {
    border: 'hover:border-teal-500',
    iconBg: 'group-hover:from-teal-500 group-hover:to-cyan-500',
    text: 'group-hover:text-teal-400',
  },
  cyan: {
    border: 'hover:border-cyan-500',
    iconBg: 'group-hover:from-cyan-500 group-hover:to-teal-500',
    text: 'group-hover:text-cyan-400',
  },
  gray: {
    border: 'hover:border-gray-500',
    iconBg: 'group-hover:from-gray-600 group-hover:to-gray-700',
    text: 'group-hover:text-gray-300',
  },
};

export function QuickActionButton({ icon, label, variant, onClick }: QuickActionButtonProps) {
  const { theme, mounted } = useTheme();
  const styles = variantStyles[variant];

  const currentTheme = mounted ? theme : 'dark';

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl backdrop-blur-sm border ${styles.border} hover:shadow-xl transition group ${
        currentTheme === 'dark'
          ? 'bg-gray-800/60 border-gray-700 hover:bg-gradient-to-br hover:from-gray-800 hover:to-gray-900'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${styles.iconBg} flex items-center justify-center mb-2 transition shadow-md ${
        currentTheme === 'dark' ? 'from-gray-700 to-gray-800' : 'from-gray-200 to-gray-300'
      }`}>
        <span className={`text-lg group-hover:scale-110 transition ${currentTheme === 'dark' ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-white'}`}>{icon}</span>
      </div>
      <span className={`text-sm font-medium ${styles.text} ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    </button>
  );
}
