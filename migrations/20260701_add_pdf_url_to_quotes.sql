-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Add pdf_url column to quotes for storing generated PDF public URL
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS pdf_url TEXT;

COMMENT ON COLUMN public.quotes.pdf_url IS 'Public URL to the generated PDF in Supabase Storage documents bucket';
