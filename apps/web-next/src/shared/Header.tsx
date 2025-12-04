'use client';
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800 text-gray-100 shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
            ForRealBank
          </h1>
        </Link>

        <nav className="hidden md:flex space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-teal-300 transition">Accueil</Link>
          <Link href="/services" className="hover:text-teal-300 transition">Nos Services</Link>
          <Link href="/about" className="hover:text-teal-300 transition">À propos</Link>
          <Link href="/contact" className="hover:text-teal-300 transition">Contact</Link>
        </nav>

        <div className="flex space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-md border border-teal-400 text-teal-300 hover:bg-teal-400/10 transition font-medium"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-400 to-cyan-500 text-gray-900 font-semibold hover:from-teal-300 hover:to-cyan-400 transition"
          >
            Inscription
          </Link>
        </div>
      </div>
    </header>
  );
}
