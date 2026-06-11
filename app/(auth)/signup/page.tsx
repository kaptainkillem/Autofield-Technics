'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { supabaseHelpers } from '@/lib/supabase';
import { SiteLogo } from '@/components/common/SiteLogo';
import { SITE_CONFIG } from '@/lib/site-config';
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

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailTouched = email.length > 0;
  const emailInvalid = emailTouched && !isValidEmail;
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

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isValidEmail) {
      setError('Please enter a valid email address.');
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

    if (!agreedToTerms) {
      setError('You must agree to the terms to create an account.');
      return;
    }

    setLoading(true);

    const { error: authError } = await supabaseHelpers.auth.signUp(email, password);

    setLoading(false);

    if (authError) {
      setError(sanitizeAuthError(authError));
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
            Almost<br />There
          </h1>
          <p className="mt-4 text-white/80 text-base leading-relaxed">
            Just one more step to activate your {SITE_CONFIG.name} account.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <p className="text-2xl font-bold text-grey">Check Your Email</p>
            <p className="text-sm text-grey mt-3 leading-relaxed">
              We&apos;ve sent a confirmation link to <span className="font-semibold">{email}</span>.
              Please check your inbox and click the verification link to activate your account.
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
          Join<br />{SITE_CONFIG.name}
        </h1>
        <p className="mt-4 text-white/80 text-base leading-relaxed">
          Create your account to start managing your services, quotes, and customer reviews from one dashboard.
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

        <p className="text-2xl font-bold text-grey mb-2">Create an Account</p>
        <p className="text-sm text-grey mb-6">Fill in your details to get started</p>

        {error && (
          <div className="flex items-center gap-2 rounded-base bg-error/10 p-3 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <p className="text-small text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="signup-email" className="text-sm font-semibold text-grey mb-2 block">
              Email
            </label>
            <div className="relative">
              {!email && (
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="signup-email"
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
            <label htmlFor="signup-password" className="text-sm font-semibold text-grey mb-2 block">
              Password
            </label>
            <div className="relative">
              {!password && (
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
            <label htmlFor="signup-confirm" className="text-sm font-semibold text-grey mb-2 block">
              Confirm Password
            </label>
            <div className="relative">
              {!confirmPassword && (
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="signup-confirm"
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

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-grey-light text-primary accent-primary cursor-pointer"
            />
            <span className="text-sm text-grey">
              I agree to the{' '}
              <a href="/terms" className="font-semibold text-primary hover:text-primary-dark transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="font-semibold text-primary hover:text-primary-dark transition-colors">Privacy Policy</a>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || passwordMismatch || !allCriteriaMet || emailInvalid || !email.trim() || !confirmPassword.trim() || !agreedToTerms}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating account\u2026' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-grey">
          Already have an account?{' '}
          <Link href="/signin" className="font-semibold text-primary hover:text-primary-dark transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}