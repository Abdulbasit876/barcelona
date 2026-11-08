'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ApiClient } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle, Clock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';

  const [email, setEmail] = useState('bookings.barcelonataxitransfer@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect straight to dashboard
    if (ApiClient.isAuthenticated()) {
      router.replace('/admin');
      return;
    }

    // Auto-fill saved email if persistent session was previously chosen
    const savedEmail = ApiClient.getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await ApiClient.login(email.trim(), password, rememberMe);
      router.replace('/admin');
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials';
      if (
        msg.toLowerCase().includes('inactive') ||
        msg.toLowerCase().includes('not authorized') ||
        msg.toLowerCase().includes('deactivated')
      ) {
        setError(
          'Access denied: You are not authorized for Administrator access or your account has been deactivated.'
        );
      } else if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('password')
      ) {
        setError('Invalid email or password. Please verify your credentials and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await ApiClient.resetPassword(email.trim());
      setResetSent(true);
    } catch {
      setResetSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Brand header with Logo */}
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Barcelona Taxi Transfer"
          className="h-16 w-auto mx-auto object-contain mb-3 drop-shadow-sm"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 font-semibold tracking-wider text-xs mt-0.5 uppercase">
          Barcelona Taxi Transfer Executive Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {resetMode ? 'Reset Password' : 'Secure Administrator Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {resetMode
                ? 'Enter your email to receive a password reset link'
                : 'Access restricted to authorized administrators only'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-navy-800" />
          </div>
        </div>

        <form
          onSubmit={resetMode ? handleReset : handleLogin}
          className="px-6 py-6 space-y-4"
        >
          {isExpired && !error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Clock className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-900">Session Expired</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Your session has expired. Please sign in again to continue.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              ✓ If this account exists, a password reset link has been sent.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-800 focus:ring-1 focus:ring-navy-800 transition shadow-sm font-medium"
                placeholder="admin@barcelonataxitransfer.com"
                autoComplete="email"
              />
            </div>
          </div>

          {!resetMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-800 focus:ring-1 focus:ring-navy-800 transition shadow-sm font-medium"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {!resetMode && (
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-navy-800 focus:ring-navy-800 transition cursor-pointer accent-navy-800"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Remember me / Keep me signed in
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-sm shadow-md transition disabled:opacity-60 mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">
                {resetMode ? 'Sending Link...' : 'Verifying with Supabase...'}
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-gold-400" />
                {resetMode ? 'Send Reset Link' : 'Sign In Securely'}
              </>
            )}
          </button>

          <div className="text-center pt-1">
            {resetMode ? (
              <button
                type="button"
                onClick={() => { setResetMode(false); setResetSent(false); }}
                className="text-xs text-navy-800 hover:underline font-bold transition"
              >
                ← Back to Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="text-xs text-slate-500 hover:text-navy-800 font-semibold transition"
              >
                Forgot password?
              </button>
            )}
          </div>
        </form>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Protected by Supabase Auth + Strict Role-Based Access Control
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-center py-12 text-xs font-bold text-slate-500">
          Loading login portal...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
