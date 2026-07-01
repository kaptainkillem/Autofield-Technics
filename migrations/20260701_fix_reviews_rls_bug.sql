-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Fix critical RLS bug: reviews UPDATE policy was USING (true), allowing ANY user to approve/reject any review
-- Replace with service_role-only policy for admin operations
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can update reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
