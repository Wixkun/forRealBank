'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buildApiUrl, BROWSER_API_BASE } from '@/lib/env';

export default function ForgotPasswordPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl(BROWSER_API_BASE, '/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Unable to send reset link');
      }

      setMessage('Si un compte existe pour cet email, un lien de reinitialisation a ete envoye.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      force-dark bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800
      bg-cover bg-center relative"
      style={{ backgroundImage: "url('/wallpaper.jpeg')" }}
    >
      <div className="absolute inset-0 bg-input" />

      <div className="relative z-10 w-full max-w-md bg-hover-strong backdrop-blur-lg border border-edge-strong rounded-2xl shadow-2xl p-8 text-fg">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm mb-1 text-gray-200">Email</label>
            <input
              type="email"
              placeholder="example@bank.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-hover-strong placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover transition
            text-white font-semibold py-2 rounded-lg shadow-lg
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            Remembered your password?{' '}
            <Link href={`/${locale}/login`} className="text-teal-400 hover:underline">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
