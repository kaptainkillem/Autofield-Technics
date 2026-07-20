-- Add quote_token to quotes table (July 2026)
-- The local DB is out of sync with schema.sql — this column is required
-- for the unauthenticated quote-claiming flow.

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS quote_token UUID UNIQUE;

-- Backfill existing quotes missing a token
UPDATE public.quotes
SET quote_token = gen_random_uuid()
WHERE quote_token IS NULL;

-- Ensure future inserts get a default token
ALTER TABLE public.quotes
ALTER COLUMN quote_token SET DEFAULT gen_random_uuid();
