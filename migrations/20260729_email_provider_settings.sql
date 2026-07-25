-- Migration: Email Provider Settings (Super-Admin Managed)
-- Moves email provider config from env vars to business_settings,
-- keeping only RESEND_API_KEY in .env as a secret.
-- Implements Option A: single master Resend account, per-tenant sender identity.

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS email_provider TEXT DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS email_from TEXT,
  ADD COLUMN IF NOT EXISTS admin_notification_email TEXT,
  ADD COLUMN IF NOT EXISTS smtp_host TEXT,
  ADD COLUMN IF NOT EXISTS smtp_port INT,
  ADD COLUMN IF NOT EXISTS smtp_username TEXT,
  ADD COLUMN IF NOT EXISTS smtp_password TEXT,
  ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT true;

-- Index for quick email provider lookups per workshop
CREATE INDEX IF NOT EXISTS idx_business_settings_email_provider ON public.business_settings(workshop_id, email_provider);
