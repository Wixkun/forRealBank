'use client';
import Image from 'next/image';

export function HeroSection() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <h1
        className="absolute text-[16vw] font-serif font-bold select-none tracking-[0.05em]
        bg-gradient-to-b from-white via-teal-200 to-teal-300
        text-transparent bg-clip-text opacity-70"
      >
        AVENIR
      </h1>

      <div 
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.75) 2px, transparent 2px)',
          backgroundSize: '4px 4px'
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center hidden">
        <div className="relative w-[560px] h-[640px] mt-20 rotate-[-45deg]">
          <Image
            src="/cb.png"
            alt="cb"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
      </div>

      <button
        onClick={scrollToFeatures}
        className="absolute bottom-8 z-20 animate-bounce cursor-pointer hover:text-teal-300 transition-colors"
        aria-label="Scroll to features"
      >
        <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </section>
  );
}
