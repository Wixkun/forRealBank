'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

type ErrorPageTemplateProps = {
  errorCode: '404' | '500';
  title: string;
  subtitle: string;
  description: string;
  primaryButton: {
    text: string;
    href: string;
  };
  secondaryButton?: {
    text: string;
    onClick?: () => void;
  };
  locale: string;
};

export function ErrorPageTemplate({
  errorCode,
  title,
  subtitle,
  description,
  primaryButton,
  secondaryButton,
  locale,
}: ErrorPageTemplateProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors ${
        currentTheme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50'
      }`}
    >
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="relative mb-8">
          <h1
            className={`text-[150px] font-bold leading-none select-none ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-500 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 bg-clip-text text-transparent'
            }`}
            style={{
              textShadow:
                currentTheme === 'dark'
                  ? '0 0 80px rgba(45, 212, 191, 0.3)'
                  : '0 0 80px rgba(20, 184, 166, 0.2)',
            }}
          >
            {title}
          </h1>

          <div
            className={`absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl ${
              currentTheme === 'dark' ? 'bg-teal-500/20' : 'bg-teal-400/30'
            }`}
          ></div>
          <div
            className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl ${
              currentTheme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-400/30'
            }`}
          ></div>
        </div>

        <h2
          className={`text-3xl font-semibold mb-4 ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {subtitle}
        </h2>

        <p
          className={`text-lg mb-8 max-w-md mx-auto ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {description}
        </p>

        <div className="mb-8 flex justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center border-2 ${
              currentTheme === 'dark'
                ? 'bg-gray-800/50 border-teal-500/30'
                : 'bg-white border-teal-400'
            }`}
          >
            <span className="text-5xl">
              {errorCode === '404' ? '🔍' : '⚠️'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={primaryButton.href}
            className={`px-8 py-3 rounded-full font-medium transition-all shadow-lg ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white'
            }`}
          >
            {primaryButton.text}
          </Link>

          {secondaryButton && (
            <button
              onClick={secondaryButton.onClick}
              className={`px-8 py-3 rounded-full font-medium transition-all border ${
                currentTheme === 'dark'
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {secondaryButton.text}
            </button>
          )}
        </div>

        <div className="mt-16">
          <Link
            href={`/${locale}`}
            className={`text-2xl font-semibold inline-block ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent'
            }`}
          >
            Avenir
          </Link>
        </div>
      </div>
    </div>
  );
}
