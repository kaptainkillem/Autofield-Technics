-- Migration: Add missing business_settings columns for full per-workshop customization
-- Idempotent: safe to run multiple times on an existing database
-- Required for: multi-tenant mechanic websites, one Vercel deployment per client, 4 clients per Supabase project

-- ═══════════════════════════════════════════════════════════════
-- 1. business_settings: add fields currently hardcoded in SITE_CONFIG
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS business_hours TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS years_experience TEXT,
  ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'ZA',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS service_radius TEXT DEFAULT '50km',
  ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'mobile and workshop-based',
  ADD COLUMN IF NOT EXISTS experience_tagline TEXT,
  ADD COLUMN IF NOT EXISTS service_tagline TEXT DEFAULT 'Mobile + Workshop Service',
  ADD COLUMN IF NOT EXISTS response_time TEXT DEFAULT '30 minutes',
  ADD COLUMN IF NOT EXISTS nav_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_show_social BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_company_reg BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Backfill sensible defaults for existing rows so existing sites don't break.
UPDATE public.business_settings
SET
  whatsapp_number = COALESCE(whatsapp_number, phone),
  business_hours = COALESCE(business_hours, 'Mon–Fri: 08:00–17:00, Sat: 08:00–12:00'),
  social_links = COALESCE(social_links, '[]'::jsonb),
  years_experience = COALESCE(years_experience, '15+'),
  specializations = COALESCE(specializations, ARRAY['Engine Repair', 'Gear box Repair', 'Diagnostic Services', 'suspension', 'brake & Clutch', 'Auto electrical']),
  region = COALESCE(region, 'Gauteng'),
  country = COALESCE(country, 'ZA'),
  currency = COALESCE(currency, 'ZAR'),
  service_radius = COALESCE(service_radius, '50km'),
  business_type = COALESCE(business_type, 'mobile and workshop-based'),
  service_tagline = COALESCE(service_tagline, 'Mobile + Workshop Service'),
  response_time = COALESCE(response_time, '30 minutes'),
  nav_links = COALESCE(nav_links, '[]'::jsonb);

-- ═══════════════════════════════════════════════════════════════
-- 2. workshops: optional domain reference for documentation
--    (tenant routing is handled per Vercel project via env var)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS domain TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshops_domain ON public.workshops(domain)
  WHERE domain IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. schema.sql sync note
-- ═══════════════════════════════════════════════════════════════
-- After applying this migration, ensure schema.sql is updated with the same
-- columns so the codebase remains the source of truth.
