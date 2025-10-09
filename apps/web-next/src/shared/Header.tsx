import Link from "next/link";

export default function Header() {
  return (
    <header className="p-4 bg-gray-100 shadow-md">
      <h1 className="text-xl font-bold">ForRealBank</h1>
      <nav className="mt-2 space-x-4">
        <Link href="/">Accueil</Link>
        <Link href="/login">Connexion</Link>
        <Link href="/register">Inscription</Link>
      </nav>
    </header>
  );
}
