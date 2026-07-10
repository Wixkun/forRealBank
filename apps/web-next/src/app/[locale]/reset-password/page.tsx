'use client';
import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildApiUrl, BROWSER_API_BASE } from '@/lib/env';

function ResetPasswordForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(BROWSER_API_BASE, '/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Impossible de reinitialiser le mot de passe',
        );
      }

      setMessage('Mot de passe reinitialise. Redirection vers la connexion...');
      setTimeout(() => router.push(`/${locale}/login`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 bg-cover bg-center relative"
      style={{ backgroundImage: "url('/wallpaper.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 text-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm">
              Lien de reinitialisation invalide.
            </div>
          )}
          {message && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-2 rounded-lg text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm mb-1 text-gray-200">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
              minLength={12}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-200">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
              minLength={12}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-primary hover:bg-primary-hover transition text-white font-semibold py-2 rounded-lg shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            <Link href={`/${locale}/login`} className="text-teal-400 hover:underline">
              Retour a la connexion
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-teal-950" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
