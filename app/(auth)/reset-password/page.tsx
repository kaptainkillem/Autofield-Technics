'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Loader2, AlertCircle, CheckCircle, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { supabaseHelpers } from '@/lib/supabase';
import { SiteLogo } from '@/components/common/SiteLogo';
import { useSiteConfig } from '@/components/providers/SiteConfigProvider';
import { sanitizeAuthError } from '@/lib/auth-utils';

const PASSWORD_CRITERIA = [
  { label: '8+ characters', met: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', met: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', met: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', met: (p: string) => /\d/.test(p) },
  { label: 'Special character', met: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthLabel(count: number) {
  if (count <= 1) return { label: 'Weak', color: 'bg-error' };
  if (count <= 3) return { label: 'Fair', color: 'bg-[#FF9800]' };
  if (count <= 4) return { label: 'Good', color: 'bg-primary' };
  return { label: 'Strong', color: 'bg-success' };
}

export default function ResetPasswordPage() {
  const config = useSiteConfig()
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hashValid, setHashValid] = useState<boolean | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      setHashValid(true);
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      setHashValid(false);
    }
  }, []);

  const passwordTouched = password.length > 0;
  const confirmPasswordTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const passwordMismatch = confirmPasswordTouched && !passwordsMatch;

  const criteria = PASSWORD_CRITERIA.map((c) => ({ label: c.label, met: c.met(password) }));
  const allCriteriaMet = criteria.every((c) => c.met);
  const metCount = criteria.filter((c) => c.met).length;
  const strength = passwordTouched ? getStrengthLabel(metCount) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!allCriteriaMet) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const rateCheck = await fetch('/api/auth/reset-password', { method: 'POST' })
    if (!rateCheck.ok) {
      setError('Too many attempts. Please wait a few minutes.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabaseHelpers.auth.updatePassword(password);

    setLoading(false);

    if (updateError) {
      setError(sanitizeAuthError(updateError));
      return;
    }

    setSuccess(true);
  };

  if (hashValid === null) {
    return (
      <div className="w-full max-w-4xl md:min-h-[560px] rounded-base shadow-lg overflow-hidden flex items-center justify-center bg-white p-8 md:p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hashValid) {
    return (
      <div className="w-full max-w-4xl md:min-h-[560px] md:grid md:grid-cols-2 rounded-base shadow-lg overflow-hidden">
        <div className="hidden md:flex bg-primary text-white p-8 md:p-12 flex-col justify-center">
          <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-white whitespace-nowrap mb-6 block text-center">
            <SiteLogo />
          </a>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            Link<br />Expired
          </h1>
          <p className="mt-4 text-white/80 text-base leading-relaxed">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden text-center mb-6">
            <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-primary whitespace-nowrap">
              <SiteLogo />
            </a>
          </div>

          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-error mb-4" />
            <p className="text-2xl font-bold text-grey">Invalid Link</p>
            <p className="text-sm text-grey mt-3 leading-relaxed">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="btn-primary mt-6 w-full text-center"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-4xl md:min-h-[560px] md:grid md:grid-cols-2 rounded-base shadow-lg overflow-hidden">
        <div className="hidden md:flex bg-primary text-white p-8 md:p-12 flex-col justify-center">
          <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-white whitespace-nowrap mb-6 block text-center">
            <SiteLogo />
          </a>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            Password<br />Updated
          </h1>
          <p className="mt-4 text-white/80 text-base leading-relaxed">
            Your {config.name} account password has been successfully changed.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden text-center mb-6">
            <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-primary whitespace-nowrap">
              <SiteLogo />
            </a>
          </div>

          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <p className="text-2xl font-bold text-grey">Password Updated</p>
            <p className="text-sm text-grey mt-3 leading-relaxed">
              Your password has been successfully changed. You can now sign in with your new credentials.
            </p>
            <Link
              href="/signin"
              className="btn-primary mt-6 w-full text-center"
            >
              Sign In
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
          Set New<br />Password
        </h1>
        <p className="mt-4 text-white/80 text-base leading-relaxed">
          Choose a strong password for your {config.name} account.
        </p>
        <div className="mt-8 hidden md:block">
          <p className="text-white/60 text-sm">
            &ldquo;{config.tagline}&rdquo;
          </p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
        <div className="md:hidden text-center mb-6">
          <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-primary whitespace-nowrap">
            <SiteLogo />
          </a>
        </div>

        <p className="text-2xl font-bold text-grey mb-2">Reset Password</p>
        <p className="text-sm text-grey mb-6">Enter your new password below</p>

        {error && (
          <div className="flex items-center gap-2 rounded-base bg-error/10 p-3 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <p className="text-small text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="reset-password" className="text-sm font-semibold text-grey mb-2 block">
              New Password
            </label>
            <div className="relative">
              {!password && (
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
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
            {passwordTouched && (
              <>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-grey">Password strength</span>
                    <span className={`text-xs font-semibold ${
                      strength?.label === 'Weak' ? 'text-error' : strength?.label === 'Fair' ? 'text-[#FF9800]' : strength?.label === 'Good' ? 'text-primary' : 'text-success'
                    }`}>
                      {strength?.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-grey-light rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength?.color ?? 'bg-grey-light'}`}
                      style={{ width: `${(metCount / PASSWORD_CRITERIA.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {criteria.map((c) => (
                    <p
                      key={c.label}
                      className={`text-xs flex items-center gap-1.5 transition-colors ${c.met ? 'text-success' : 'text-error'}`}
                    >
                      {c.met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {c.label}
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <label htmlFor="reset-confirm" className="text-sm font-semibold text-grey mb-2 block">
              Confirm New Password
            </label>
            <div className="relative">
              {!confirmPassword && (
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="reset-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className={`w-full rounded-base border bg-white py-3 pl-10 pr-10 text-grey transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  passwordMismatch
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : confirmPasswordTouched && passwordsMatch
                      ? 'border-success focus:border-success focus:ring-success/20'
                      : 'border-grey-light focus:border-primary focus:ring-primary/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-medium hover:text-grey transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordMismatch && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Passwords do not match
              </p>
            )}
            {confirmPasswordTouched && passwordsMatch && (
              <p className="mt-1.5 text-xs text-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allCriteriaMet || passwordMismatch || !confirmPassword.trim()}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Updating password\u2026' : 'Update Password'}
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