-- RLS Policy Fixes — July 2026
-- Fixes 6 violations found in the full endpoint audit

-- 1. Profiles: allow users to delete their own profile
CREATE POLICY "Profiles delete own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. Appointments: allow clients to update their own appointments (accept/decline proposals, reschedule)
CREATE POLICY "Appointments update own" ON public.appointments FOR UPDATE USING (user_id = auth.uid());

-- 3. Work orders: allow clients to update via their linked quote (respond to additional work revisions)
CREATE POLICY "Work orders update own" ON public.work_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM quotes q WHERE q.id = work_orders.quote_id AND q.user_id = auth.uid())
  AND workshop_id = public.current_workshop_id()
);

-- 4. Blocked slots: allow public read by workshop (fixes availability endpoint — was invisible to unauthenticated)
CREATE POLICY "Blocked slots read by workshop" ON public.blocked_slots FOR SELECT USING (
  EXISTS (SELECT 1 FROM workshops WHERE id = workshop_id)
);

-- 5. Categories: allow workshop admins to manage OWN workshop's categories (was super_admin only, now with tenant isolation)
DROP POLICY IF EXISTS "Categories manage super admin" ON public.categories;
CREATE POLICY "Categories manage staff" ON public.categories FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
  AND (public.current_workshop_id() = workshop_id OR public.is_super_admin())
);

-- 6. FAQs: allow workshop admins to manage OWN workshop's FAQs (was super_admin only, now with tenant isolation)
DROP POLICY IF EXISTS "FAQs manage super admin" ON public.faqs;
CREATE POLICY "FAQs manage staff" ON public.faqs FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
  AND (public.current_workshop_id() = workshop_id OR public.is_super_admin())
);

-- 7. SEO registry: allow workshop admins to manage (was super_admin only)
DROP POLICY IF EXISTS "SEO registry manage super admin" ON public.seo_registry;
CREATE POLICY "SEO registry manage staff" ON public.seo_registry FOR ALL USING (public.current_user_role() IN ('admin', 'super_admin'));

-- ═══ STORAGE RLS POLICIES ═══

-- Bucket: documents (quote & invoice PDFs — contains personal data)
-- Only workshop admins/super_admins can read PDFs directly from storage
-- Customer PDF access goes through the Next.js API route (api/quotes/[id]/pdf) which verifies ownership server-side
CREATE POLICY "Documents read by workshop admin" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (
    public.is_super_admin()
    OR (storage.foldername(name))[1] = public.current_workshop_id()::text
  )
);

-- Only admins/super_admins can upload to documents bucket (PDF generation)
CREATE POLICY "Documents insert by admin" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- Bucket: logos (workshop branding images — public read, admin write)
CREATE POLICY "Logos read public" ON storage.objects FOR SELECT USING (
  bucket_id = 'logos'
);

CREATE POLICY "Logos insert by admin" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
);
