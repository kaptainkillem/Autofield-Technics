-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
DO $$ BEGIN
  ALTER TABLE public.quotes ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quotes_status_check' AND conrelid = 'public.quotes'::regclass
  ) THEN
    ALTER TABLE public.quotes
      ADD CONSTRAINT quotes_status_check
      CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled'));
  END IF;
END $$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined'));

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
