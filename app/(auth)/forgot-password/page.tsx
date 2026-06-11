'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, MailCheck } from 'lucide-react';
import { supabaseHelpers } from '@/lib/supabase';
import { SiteLogo } from '@/components/common/SiteLogo';
import { SITE_CONFIG } from '@/lib/site-config';
import { sanitizeAuthError } from '@/lib/auth-utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailTouched = email.length > 0;
  const emailInvalid = emailTouched && !isValidEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabaseHelpers.auth.resetPassword(email);

    setLoading(false);

    if (resetError) {
      setError(sanitizeAuthError(resetError));
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="w-full max-w-4xl md:min-h-[560px] md:grid md:grid-cols-2 rounded-base shadow-lg overflow-hidden">
        <div className="hidden md:flex bg-primary text-white p-8 md:p-12 flex-col justify-center">
          <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-white whitespace-nowrap mb-6 block text-center">
            <SiteLogo />
          </a>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            Check<br />Your<br />Email
          </h1>
          <p className="mt-4 text-white/80 text-base leading-relaxed">
            We&apos;ve sent a password reset link to your inbox.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden text-center mb-6">
            <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-primary whitespace-nowrap">
              <SiteLogo />
            </a>
          </div>

          <div className="flex flex-col items-center text-center">
            <MailCheck className="h-12 w-12 text-success mb-4" />
            <p className="text-2xl font-bold text-grey">Reset Link Sent</p>
            <p className="text-sm text-grey mt-3 leading-relaxed">
              We&apos;ve sent a password reset link to <span className="font-semibold">{email}</span>.
              Please check your inbox and follow the instructions to set a new password.
            </p>
            <Link
              href="/signin"
              className="btn-primary mt-6 w-full text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl md:min-h-[560px] md:grid md:grid-cols-2 rounded-base shadow-lg overflow-hidden">
      <div className="hidden md:flex bg-primary text-white p-8 md:p-12 flex-col justify-center">
        <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-white whitespace-nowrap mb-6 block text-center">
          <SiteLogo />
        </a>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          Reset Your<br />Password
        </h1>
        <p className="mt-4 text-white/80 text-base leading-relaxed">
          Enter your email and we&apos;ll send you a link to reset your password for your {SITE_CONFIG.name} account.
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

        <p className="text-2xl font-bold text-grey mb-2">Forgot Password?</p>
        <p className="text-sm text-grey mb-6">Enter your email and we&apos;ll send you a reset link</p>

        {error && (
          <div className="flex items-center gap-2 rounded-base bg-error/10 p-3 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <p className="text-small text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="forgot-email" className="text-sm font-semibold text-grey mb-2 block">
              Email
            </label>
            <div className="relative">
              {!email && (
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="forgot-email"
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

          <button
            type="submit"
            disabled={loading || !email.trim() || emailInvalid}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending link\u2026' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-grey">
          Remember your password?{' '}
          <Link href="/signin" className="font-semibold text-primary hover:text-primary-dark transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}