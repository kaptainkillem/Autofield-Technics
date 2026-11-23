-- Migration: Expanded workshop theme color tokens
-- Purpose: Add heading, subtext, hero background, and hero text colors
--          in addition to the existing primary/accent/text colors.

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS heading_color TEXT DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS subtext_color TEXT DEFAULT '#595959',
  ADD COLUMN IF NOT EXISTS hero_bg_color TEXT DEFAULT '#E8E8E8',
  ADD COLUMN IF NOT EXISTS hero_text_color TEXT DEFAULT '#111827';

COMMENT ON COLUMN public.business_settings.heading_color IS 'Public site h1-h4 heading color';
COMMENT ON COLUMN public.business_settings.subtext_color IS 'Public site captions, secondary, and muted text color';
COMMENT ON COLUMN public.business_settings.hero_bg_color IS 'Hero section background color';
COMMENT ON COLUMN public.business_settings.hero_text_color IS 'Hero headline and lead text color';

-- ─── Recreate the safe view to include new theme columns ─────────────────────
DROP VIEW IF EXISTS public.public_business_settings CASCADE;

CREATE OR REPLACE VIEW public.public_business_settings
WITH (security_invoker = false)
AS
SELECT
  workshop_id,
  primary_color,
  accent_color,
  favicon_url,
  notification_email,
  notification_push,
  notification_whatsapp,
  whatsapp_auto_reply,
  whatsapp_business_only,
  email_display_name,
  email_reply_to,
  smtp_note,
  site_name,
  phone,
  whatsapp_number,
  city,
  region,
  country,
  currency,
  hero_title,
  hero_description,
  hero_image_url,
  contact_email,
  document_footer,
  business_hours,
  social_links,
  years_experience,
  specializations,
  service_radius,
  business_type,
  experience_tagline,
  service_tagline,
  response_time,
  nav_links,
  footer_show_social,
  footer_show_email,
  footer_show_company_reg,
  og_image_url,
  font_family,
  home_page_content,
  company_name,
  logo_url,
  address,
  vat_number,
  registration_number,
  bank_name,
  account_holder,
  account_number,
  branch_code,
  terms_conditions,
  hourly_rate,
  callout_fee,
  diagnostic_fee,
  default_deposit_percent,
  primary_text_color,
  secondary_text_color,
  heading_color,
  subtext_color,
  hero_bg_color,
  hero_text_color,
  created_at,
  updated_at
FROM public.business_settings;

GRANT SELECT ON public.public_business_settings TO anon, authenticated;

REVOKE SELECT ON public.business_settings FROM anon, authenticated;
