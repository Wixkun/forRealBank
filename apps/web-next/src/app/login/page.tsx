"use client";

import React, { useState } from "react";

export default function AuthLanding({ imageSrc = "/robot-helmet.jpg" }: { imageSrc?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#0b0e14] text-slate-100 relative overflow-hidden">
      {/* soft border radius frame */}

      {/* top glow accents */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-30 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-indigo-500" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-30 bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-500" />

      {/* NAVBAR */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-10 text-sm text-slate-300">
          <a className="hover:text-white transition" href="#">Home</a>
          <a className="hover:text-white transition" href="#">About</a>
          <a className="hover:text-white transition" href="#">Blog</a>
          <a className="hover:text-white transition" href="#">Pages</a>
          <a className="hover:text-white transition" href="#">Contact</a>
        </div>

        <div className="flex items-center gap-6">
          {/* Language */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>English</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-70"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          <a className="text-sm text-slate-300 hover:text-white transition" href="#signin">Sign in</a>
          <a
            href="#signin"
            className="rounded-full bg-white text-[#0b0e14] text-sm px-5 py-2 font-medium hover:opacity-90 transition"
          >
            Register
          </a>
        </div>
      </nav>

      {/* GRID */}
      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 pb-12 pt-4 md:grid-cols-2 md:gap-4 md:pt-2">
        {/* IMAGE SIDE */}
        <div className="order-2 md:order-1">
          <div className="relative mx-auto aspect-[4/5] max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-black shadow-2xl">
            {/* Subtle inner glow frame */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/5" />
            <img
              src={imageSrc}
              alt="Futuristic chrome android helmet"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* FORM SIDE */}
        <div id="signin" className="order-1 md:order-2 flex w-full items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="space-y-1 text-center">
              <p className="text-xl font-semibold tracking-wide">Hello !</p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide">Welcome Back</h1>
            </div>

            <form className="mt-8 space-y-4">
              <label className="block">
                <span className="sr-only">Email</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 focus-within:border-white/20">
                  <input
                    type="email"
                    placeholder="Enter Email"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-300/70"
                  />
                  {/* right icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-70"><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-10 5 5-6h-3V7h-4v4H7l5 6Z" stroke="currentColor" strokeWidth="1.5"/></svg>
                </div>
              </label>

              <label className="block">
                <span className="sr-only">Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 focus-within:border-white/20">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm tracking-widest outline-none placeholder:text-slate-300/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="opacity-70 transition hover:opacity-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M21 12s-3.6-7-9-7-9 7-9 7a15.48 15.48 0 004.62 4.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                    )}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-end text-xs text-slate-300/80">
                <a href="#" className="hover:text-white">Recover Password ?</a>
              </div>

              <button
                type="submit"
                className="group relative w-full rounded-xl bg-white py-3 text-center font-semibold text-[#0b0e14] transition hover:opacity-90"
              >
                <span>Sign In</span>
                <span className="pointer-events-none absolute inset-x-0 -bottom-[6px] mx-auto h-3 w-[92%] rounded-b-xl bg-white/20 blur-md" />
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 mx-auto h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative mx-auto w-max bg-[#0b0e14] px-3 text-xs text-slate-400">Or continue with</div>
              </div>

              {/* Socials */}
              <div className="grid grid-cols-3 gap-4">
                <button type="button" className="rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-sm hover:bg-white/10 transition">
                  <span className="inline-flex items-center gap-2 justify-center w-full">
                    {GoogleIcon}
                  </span>
                </button>
                <button type="button" className="rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-sm hover:bg-white/10 transition">
                  <span className="inline-flex items-center gap-2 justify-center w-full">
                    {AppleIcon}
                  </span>
                </button>
                <button type="button" className="rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-sm hover:bg-white/10 transition">
                  <span className="inline-flex items-center gap-2 justify-center w-full">
                    {FacebookIcon}
                  </span>
                </button>
              </div>

              <p className="pt-2 text-center text-sm text-slate-300/90">
                Don’t Have an account ? {" "}
                <a href="#" className="font-semibold hover:underline">Create Account!</a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

const GoogleIcon = (
  <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M44.5 20H24v8.5h11.9C34.9 32.9 30.1 36 24 36c-6.6 0-12.2-4.5-14-10.6S11 10 17.1 8.2c5-1.5 10.4.2 13.6 4.3l6.2-6.2C31.6 1.7 24.4-.5 17.8 1.1 8.4 3.5 2 12.3 3.2 21.9 4.6 33.1 14.4 42 25.7 41.9c10.5 0 20.1-7.6 18.8-21.9z" fill="currentColor"/>
  </svg>
);

const AppleIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.71 19.5c-1.16 1.74-2.72 1.47-4.09.85-1.45-.63-2.78-.64-4.3 0-1.88.82-3 .57-4.17-1.11-2.24-3.2-1.86-8.24 1.3-9.37 1.39-.51 2.69-.12 3.98.46 1.19.55 2.29.53 3.43 0 1.55-.72 2.94-.62 4.02.31 2.07 1.77 1.77 6.06-.17 8.86zM13.82 4.39c.82-1.05 1.19-2.16 1.09-3.39-1.21.08-2.29.57-3.1 1.52-.78.93-1.21 2.05-1.12 3.3 1.19.09 2.23-.51 3.13-1.43z"/>
  </svg>
);

const FacebookIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12z"/>
  </svg>
);
