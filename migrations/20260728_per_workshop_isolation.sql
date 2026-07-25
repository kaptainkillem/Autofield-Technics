-- Migration: Per-Workshop Multi-Tenant Isolation
-- Fixes tables missing workshop_id, broken unique constraints,
-- and global data leakage across workshops.
-- Designed for 4 workshops per Supabase project, 1 deployment each.

-- ═══════════════════════════════════════════════════════════════
-- 1. seo_registry — global fallback + per-workshop overrides
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.seo_registry
  ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;

ALTER TABLE public.seo_registry DROP CONSTRAINT IF EXISTS seo_registry_path_url_key;
ALTER TABLE public.seo_registry ADD CONSTRAINT seo_registry_workshop_path_unique UNIQUE NULLS NOT DISTINCT (workshop_id, path_url);

CREATE INDEX IF NOT EXISTS idx_seo_registry_workshop_path ON public.seo_registry(workshop_id, path_url);

-- RLS: public reads (anonymous) remain open — app code filters by workshop.
-- Existing "SEO read public" and "SEO manage super admin" from prior migration
-- are sufficient.

-- ═══════════════════════════════════════════════════════════════
-- 2. seo_locations — strictly per-workshop (geo must be isolated)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.seo_locations
  ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;

-- Backfill: assign existing locations to the first active workshop
DO $$ DECLARE first_id UUID; BEGIN
  SELECT id INTO first_id FROM public.workshops WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF first_id IS NOT NULL THEN
    UPDATE public.seo_locations SET workshop_id = first_id WHERE workshop_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.seo_locations ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.seo_locations ADD CONSTRAINT seo_locations_workshop_geo_unique UNIQUE (workshop_id, province, city, suburb);

CREATE INDEX IF NOT EXISTS idx_seo_locations_workshop_city ON public.seo_locations(workshop_id, city);

-- RLS: super-admin only manages; public reads open — app filters by workshop
DROP POLICY IF EXISTS "Service role can manage SEO locations" ON public.seo_locations;
DROP POLICY IF EXISTS "SEO locations read public" ON public.seo_locations;
DROP POLICY IF EXISTS "SEO locations manage super admin" ON public.seo_locations;

CREATE POLICY "SEO locations read public" ON public.seo_locations
FOR SELECT USING (is_active = true);

CREATE POLICY "SEO locations manage super admin" ON public.seo_locations
FOR ALL USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ═══════════════════════════════════════════════════════════════
-- 3. categories — strictly per-workshop
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_workshop_slug_unique UNIQUE (workshop_id, slug);

-- Backfill NULL workshop_ids to first active workshop
DO $$ DECLARE first_id UUID; BEGIN
  SELECT id INTO first_id FROM public.workshops WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF first_id IS NOT NULL THEN
    UPDATE public.categories SET workshop_id = first_id WHERE workshop_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.categories ALTER COLUMN workshop_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_workshop_id ON public.categories(workshop_id);

-- Existing "Categories read global" is fine (public reads). Manage policy already checks workshop_id.

-- Replace public SELECT with scoped policy: anonymous sees all, authenticated sees own workshop
DROP POLICY IF EXISTS "Categories read global" ON public.categories;
DROP POLICY IF EXISTS "Categories read scoped" ON public.categories;
CREATE POLICY "Categories read scoped" ON public.categories
FOR SELECT USING (
  auth.uid() IS NULL
  OR workshop_id = public.current_workshop_id()
  OR public.is_super_admin()
);

-- ═══════════════════════════════════════════════════════════════
-- 4. faqs — global fallback + per-workshop overrides
-- ═══════════════════════════════════════════════════════════════
-- workshop_id stays nullable (NULL = global default).
CREATE INDEX IF NOT EXISTS idx_faqs_workshop_id ON public.faqs(workshop_id);

  DROP POLICY IF EXISTS "FAQs read global" ON public.faqs;
DROP POLICY IF EXISTS "FAQs read scoped" ON public.faqs;
CREATE POLICY "FAQs read scoped" ON public.faqs
FOR SELECT USING (
  is_active = true
  AND (
    auth.uid() IS NULL
    OR workshop_id = public.current_workshop_id()
    OR workshop_id IS NULL
    OR public.is_super_admin()
  )
);

-- ═══════════════════════════════════════════════════════════════
-- 5. working_hours — fix broken UNIQUE constraint (critical bug)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.working_hours DROP CONSTRAINT IF EXISTS working_hours_day_of_week_key;
ALTER TABLE public.working_hours ADD CONSTRAINT working_hours_workshop_day_unique UNIQUE (workshop_id, day_of_week);

-- Backfill + make NOT NULL (should already be populated via app code)
DO $$ DECLARE first_id UUID; BEGIN
  SELECT id INTO first_id FROM public.workshops WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF first_id IS NOT NULL THEN
    UPDATE public.working_hours SET workshop_id = first_id WHERE workshop_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.working_hours ALTER COLUMN workshop_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_working_hours_workshop ON public.working_hours(workshop_id);

-- RLS: replace global service_role policy with tenant-scoped manage policy
DROP POLICY IF EXISTS "Service role can manage working hours" ON public.working_hours;
DROP POLICY IF EXISTS "Working hours manage tenant scoped" ON public.working_hours;
CREATE POLICY "Working hours manage tenant scoped" ON public.working_hours
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- ═══════════════════════════════════════════════════════════════
-- 6. leads — add workshop_id (was completely missing)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;

DO $$ DECLARE first_id UUID; BEGIN
  SELECT id INTO first_id FROM public.workshops WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF first_id IS NOT NULL THEN
    UPDATE public.leads SET workshop_id = first_id WHERE workshop_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.leads ALTER COLUMN workshop_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_workshop_id ON public.leads(workshop_id);

DROP POLICY IF EXISTS "Service role can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Leads tenant isolated" ON public.leads;
CREATE POLICY "Leads tenant isolated" ON public.leads
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- ═══════════════════════════════════════════════════════════════
-- 7. receipts — make workshop_id NOT NULL
-- ═══════════════════════════════════════════════════════════════
DO $$ DECLARE first_id UUID; BEGIN
  SELECT id INTO first_id FROM public.workshops WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF first_id IS NOT NULL THEN
    UPDATE public.receipts SET workshop_id = first_id WHERE workshop_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.receipts ALTER COLUMN workshop_id SET NOT NULL;

DROP POLICY IF EXISTS "Service role can manage receipts" ON public.receipts;
DROP POLICY IF EXISTS "Receipts tenant isolated" ON public.receipts;
CREATE POLICY "Receipts tenant isolated" ON public.receipts
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- ═══════════════════════════════════════════════════════════════
-- 8. expenses — make workshop_id NOT NULL
-- ═══════════════════════════════════════════════════════════════
DO $$ DECLARE first_id UUID; BEGIN
  SELECT id INTO first_id FROM public.workshops WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF first_id IS NOT NULL THEN
    UPDATE public.expenses SET workshop_id = first_id WHERE workshop_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.expenses ALTER COLUMN workshop_id SET NOT NULL;

DROP POLICY IF EXISTS "Service role can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expenses tenant isolated" ON public.expenses;
CREATE POLICY "Expenses tenant isolated" ON public.expenses
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- ═══════════════════════════════════════════════════════════════
-- 9. analytics — fix unique constraint + make workshop_id NOT NULL
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_user_id_month_year_key;
ALTER TABLE public.analytics ADD CONSTRAINT analytics_workshop_user_month_year_unique UNIQUE (workshop_id, user_id, month, year);

DO $$ DECLARE first_id UUID; BEGIN
  SELECT id INTO first_id FROM public.workshops WHERE status = 'active' ORDER BY created_at LIMIT 1;
  IF first_id IS NOT NULL THEN
    UPDATE public.analytics SET workshop_id = first_id WHERE workshop_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.analytics ALTER COLUMN workshop_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_workshop ON public.analytics(workshop_id);

-- ═══════════════════════════════════════════════════════════════
-- 10. Add helpful composite indexes
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_receipts_workshop_job_date ON public.receipts(workshop_id, job_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_workshop_expense_date ON public.expenses(workshop_id, expense_date DESC);
