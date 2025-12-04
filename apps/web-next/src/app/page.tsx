import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0d0f14] text-white overflow-hidden flex flex-col items-center justify-center">
      <h1
        className="absolute text-[16vw] font-serif font-bold select-none tracking-[0.05em]
        bg-gradient-to-b from-white via-teal-200 to-teal-300
        text-transparent bg-clip-text opacity-70"
      >
        FORREAL
      </h1>

      <section className="relative z-10 flex flex-col items-center text-center">
        <div className="relative w-[560px] h-[640px] mt-20 rotate-[-45deg]"> 
          <Image
            src="/cb.png"
            alt="cb"
            fill
            className="object-contain drop-shadow-2xl"
          />
        </div>

        <div className="mt-10 max-w-xl">
          <h2 className="text-3xl font-serif mb-2">Eudaimonia</h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            La recherche de la sagesse et de la paix intérieure à travers la
            raison, la vertu et la maîtrise de soi. Un chemin vers la vraie
            liberté.
          </p>
        </div>
      </section>
    </main>
  );
}
