'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseHelpers } from '@/lib/supabase';
import { SiteLogo } from '@/components/common/SiteLogo';
import { SITE_CONFIG } from '@/lib/site-config';
import { sanitizeFormError } from '@/lib/auth-utils';

const CURRENT_YEAR = new Date().getFullYear();

export default function OnboardingVehiclePage() {
  const router = useRouter();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!make.trim() || !model.trim() || !year.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2027) {
      setError('Year must be between 1900 and 2027.');
      return;
    }

    setLoading(true);

    const { error: vehicleError } = await supabaseHelpers.vehicles.create({
      make: make.trim(),
      model: model.trim(),
      year: yearNum,
    });

    if (vehicleError) {
      setLoading(false);
      setError(sanitizeFormError(vehicleError));
      return;
    }

    const { error: profileError } = await supabaseHelpers.profiles.updateOnboarding(true);

    if (profileError) {
      setLoading(false);
      setError(sanitizeFormError(profileError));
      return;
    }

    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });

    setLoading(false);
    router.push('/dashboard');
  };

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
          Add your vehicle details so {SITE_CONFIG.name} can provide you with accurate service and quotes.
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
            <p className="text-2xl font-bold text-grey">Car Information</p>
            <span className="text-sm font-semibold text-primary">Step 2 of 2</span>
          </div>
          <div className="w-full bg-grey-light rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <p className="text-sm text-grey mb-6">Tell us about your primary vehicle</p>

        {error && (
          <div className="flex items-center gap-2 rounded-base bg-error/10 p-3 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <p className="text-small text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="vehicle-make" className="text-sm font-semibold text-grey mb-2 block">
              Vehicle Make
            </label>
            <div className="relative">
              {!make && (
                <Car className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="vehicle-make"
                type="text"
                autoComplete="off"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                disabled={loading}
                className="w-full rounded-base border border-grey-light bg-white py-3 pl-10 pr-4 text-grey transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vehicle-model" className="text-sm font-semibold text-grey mb-2 block">
              Vehicle Model
            </label>
            <div className="relative">
              {!model && (
                <Car className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="vehicle-model"
                type="text"
                autoComplete="off"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
                className="w-full rounded-base border border-grey-light bg-white py-3 pl-10 pr-4 text-grey transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vehicle-year" className="text-sm font-semibold text-grey mb-2 block">
              Year of Manufacture
            </label>
            <div className="relative">
              {!year && (
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey-medium" />
              )}
              <input
                id="vehicle-year"
                type="number"
                min={1900}
                max={2027}
                autoComplete="off"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
                className="w-full rounded-base border border-grey-light bg-white py-3 pl-10 pr-4 text-grey transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !make.trim() || !model.trim() || !year.trim()}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Saving\u2026' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}