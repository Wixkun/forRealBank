import Link from 'next/link';

type CTASectionProps = {
  title: string;
  description: string;
  buttonText: string;
  locale: string;
};

export function CTASection({ title, description, buttonText, locale }: CTASectionProps) {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-900/40 to-teal-950/40 backdrop-blur-sm rounded-3xl border border-teal-500/30 p-12 lg:p-16">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-center space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold">
              <span className="bg-gradient-to-r from-white via-teal-100 to-teal-300 bg-clip-text text-transparent">
                {title}
              </span>
            </h2>

            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">{description}</p>

            <div className="pt-4">
              <Link
                href={`/${locale}/register`}
                className="inline-block px-10 py-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-semibold shadow-2xl shadow-teal-500/40 transition-all duration-300 hover:scale-105"
              >
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
