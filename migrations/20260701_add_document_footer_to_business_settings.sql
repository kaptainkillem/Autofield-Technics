-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Add document_footer column to business_settings for PDF footer legal text
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS document_footer TEXT;

COMMENT ON COLUMN public.business_settings.document_footer IS 'Custom footer text for PDF documents (e.g. warranty terms, VAT notes)';
