'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { supabaseHelpers } from '@/lib/supabase';
import { SiteLogo } from '@/components/common/SiteLogo';
import { SITE_CONFIG } from '@/lib/site-config';
import { sanitizeFormError } from '@/lib/auth-utils';

export default function OnboardingProfilePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    setLoading(true);

    const { error: upsertError } = await supabaseHelpers.profiles.upsert({
      full_name: fullName.trim(),
      phone: phone.trim(),
    });

    setLoading(false);

    if (upsertError) {
      setError(sanitizeFormError(upsertError));
      return;
    }

    router.push('/onboarding/vehicle');
  };

  return (
    <div className="w-full max-w-4xl md:min-h-[560px] md:grid md:grid-cols-2 rounded-base shadow-lg overflow-hidden">
      <div className="hidden md:flex bg-primary text-white p-8 md:p-12 flex-col justify-center">
        <a href="/" className="no-underline tracking-widest uppercase text-xl font-bold text-white whitespace-nowrap mb-6 block text-center">
          <SiteLogo />
        </a>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          Welcome<br />Aboard
        </h1>
        <p className="mt-4 text-white/80 text-base leading-relaxed">
          Let&apos;s set up your {SITE_CONFIG.name} account. This will only take a moment.
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

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xl font-bold text-grey">Account Details</p>
            <span className="text-sm font-semibold text-primary">Step 1 of 2</span>
          </div>
          <div className="w-full bg-grey-light rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }} />
          </div>
        </div>
        <p className="text-sm text-grey mb-6">Tell us a bit about yourself</p>

        {error && (
          <div className="flex items-center gap-2 rounded-base bg-error/10 p-3 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <p className="text-small text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="profile-name" className="text-sm font-semibold text-grey mb-2 block">
              Full Name
            </label>
            <div className="relative">
              {!fullName && (
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="w-full rounded-base border border-grey-light bg-white py-3 pl-10 pr-4 text-grey transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-phone" className="text-sm font-semibold text-grey mb-2 block">
              Phone Number
            </label>
            <div className="relative">
              {!phone && (
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="w-full rounded-base border border-grey-light bg-white py-3 pl-10 pr-4 text-grey transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !fullName.trim() || !phone.trim()}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Saving\u2026' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}