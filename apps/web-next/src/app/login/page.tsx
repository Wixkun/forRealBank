'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
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
          ForReal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <a href="#" className="hover:text-teal-300 transition">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 
            hover:from-teal-400 hover:to-cyan-500 transition 
            text-white font-semibold py-2 rounded-lg shadow-lg"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            Don’t have an account?{' '}
            <a href="/register" className="text-teal-400 hover:underline">
              Register
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
