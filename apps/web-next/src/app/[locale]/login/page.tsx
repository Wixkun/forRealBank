'use client';
import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locale = pathname.split('/')[1] || 'en';

  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please login.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    console.log('📝 Login attempt:', { email, password });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      console.log('🌐 API URL:', apiUrl);
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📡 Response body:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('✅ Login success, navigating to /' + locale + '/dashboard');
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token || 'authenticated');
      }
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 500);
    } catch (err: unknown) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800 
      bg-cover bg-center relative"
      style={{ backgroundImage: "url('/wallpaper.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 text-white">
        
        <h2
          className="text-4xl font-bold text-center mb-6 
          bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 
          bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]"
        >
          Avenir
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-2 rounded-lg text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm">
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
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-200">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-gray-300 
              focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-teal-500" /> Remember me
            </label>
            <Link href="/forgot-password" className="hover:text-teal-300 transition">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 
            hover:from-teal-400 hover:to-cyan-500 transition 
            text-white font-semibold py-2 rounded-lg shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            Don’t have an account?{' '}
            <Link href="/register" className="text-teal-400 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
