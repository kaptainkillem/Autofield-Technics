'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { SiteLogo } from '@/components/common/SiteLogo';
import { SITE_CONFIG } from '@/lib/site-config';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailTouched = email.length > 0;
  const emailInvalid = emailTouched && !isValidEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isValidEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Sign in failed. Please try again.');
        toast.error(data.error || 'Sign in failed. Please try again.');
        setLoading(false);
        return;
      }

      toast.success('Signed in successfully!');

      window.location.href = '/dashboard';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl md:min-h-[560px] md:grid md:grid-cols-2 rounded-base shadow-lg overflow-hidden">
      <div className="hidden md:flex bg-primary text-white p-8 md:p-12 flex-col justify-center">
        <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-white whitespace-nowrap mb-6 block text-center">
          <SiteLogo />
        </a>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          {SITE_CONFIG.dashboard.clientTitle}
        </h1>
        <p className="mt-4 text-white/80 text-base leading-relaxed">
          Sign in to manage your services, quotes, and reviews from your {SITE_CONFIG.name} dashboard.
        </p>
        <div className="mt-8 hidden md:block">
          <p className="text-white/60 text-sm">
            &ldquo;{SITE_CONFIG.tagline}&rdquo;
          </p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
        <div className="md:hidden text-center mb-6">
          <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-primary whitespace-nowrap">
            <SiteLogo />
          </a>
        </div>

        <p className="text-2xl font-bold text-grey mb-2">Sign In</p>
        <p className="text-sm text-grey mb-6">Enter your credentials to access your account</p>

        {error && (
          <div className="flex items-center gap-2 rounded-base bg-error/10 p-3 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <p className="text-small text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="signin-email" className="text-sm font-semibold text-grey mb-2 block">
              Email
            </label>
            <div className="relative">
              {!email && (
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={`w-full rounded-base border bg-white py-3 pl-10 pr-4 text-grey transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  emailInvalid
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : emailTouched && isValidEmail
                      ? 'border-success focus:border-success focus:ring-success/20'
                      : 'border-grey-light focus:border-primary focus:ring-primary/20'
                }`}
              />
            </div>
            {emailInvalid && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Please enter a valid email address
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="signin-password" className="text-sm font-semibold text-grey">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              {!password && (
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-base border border-grey-light bg-white py-3 pl-10 pr-10 text-grey transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-medium hover:text-grey transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || emailInvalid}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Signing in\u2026' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-grey">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:text-primary-dark transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}