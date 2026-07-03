-- 20260703_fix_quotes_status_constraint.sql
-- Drops the old 'status_valid' constraint that doesn't include 'declined',
-- and ensures the correct 'quotes_status_check' constraint is in place.

-- Drop the old constraint from the live database
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS status_valid;

-- Drop and recreate the correct constraint to ensure it's up to date
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled'));
