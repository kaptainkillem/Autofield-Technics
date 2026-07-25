-- Migration: Workshop Status + Soft Delete + Billing Tracking + Scope Partition
-- Adds operational status, billing tracking, and safety-lock columns so
-- super-admins can suspend/deactivate a workshop without losing data.

-- 1. Workshop status and billing columns
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'paid'
    CHECK (billing_status IN ('paid', 'past_due', 'cancelled')),
  ADD COLUMN IF NOT EXISTS suspended_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 2. Backfill existing workshops (safe no-op on future runs)
DO $$ BEGIN
  UPDATE public.workshops
  SET status = 'active'
  WHERE status IS NULL;

  UPDATE public.workshops
  SET billing_status = 'paid'
  WHERE billing_status IS NULL;
END $$;

-- 3. Index for filtering active/suspended workshops
CREATE INDEX IF NOT EXISTS idx_workshops_status ON public.workshops (status);
CREATE INDEX IF NOT EXISTS idx_workshops_billing_status ON public.workshops (billing_status);

-- 4. RLS: email_templates — super-admin only (mechanics must not touch HTML)
DROP POLICY IF EXISTS "Staff can manage their workshop email templates" ON public.email_templates;
CREATE POLICY "Email templates super admin only" ON public.email_templates
FOR ALL USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 5. RLS: seo_registry — super-admin only
DROP POLICY IF EXISTS "Anyone can read active SEO entries" ON public.seo_registry;
DROP POLICY IF EXISTS "Service role can manage SEO entries" ON public.seo_registry;

CREATE POLICY "SEO read public" ON public.seo_registry
FOR SELECT USING (is_active = true);

CREATE POLICY "SEO manage super admin" ON public.seo_registry
FOR ALL USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 6. RLS: business_settings — kept as-is (admin + super_admin can write).
--    Sensitive columns (branding, font, homepage_content, email config) are
--    protected by removing their UI from the admin dashboard. Mechanics
--    cannot access the edit forms, so they cannot accidentally change them.
--    Operational fields (phone, address, working hours) remain writable.
