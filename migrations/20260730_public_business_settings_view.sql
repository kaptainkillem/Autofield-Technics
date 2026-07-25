-- Migration: public_business_settings View
-- Purpose: Exposes only tenant-safe columns from business_settings to public
-- and standard admin roles. SMTP credentials and email provider config are
-- physically excluded at the database level.
--
-- Architecture:
--   - View is SECURITY DEFINER (runs as owner) to bypass base table RLS for reads.
--   - Direct SELECT on business_settings is REVOKED from anon/authenticated.
--   - Workshop-level filtering is done in application code via .eq('workshop_id', ...).
--   - Standard admins query public_business_settings for reads.
--   - Super-admins and service-role queries target the raw business_settings table.
--   - Admin upserts still use business_settings directly (modify RLS handles auth).

-- ─── Create the Safe View ────────────────────────────────────────────────────────
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
  created_at,
  updated_at
FROM public.business_settings;

-- The following columns are intentionally excluded from the view:
--   email_provider, email_from, admin_notification_email,
--   smtp_host, smtp_port, smtp_username, smtp_password, smtp_secure

-- ─── Grants ──────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.public_business_settings TO anon, authenticated;

-- ─── Lock Down the Base Table ────────────────────────────────────────────────────
REVOKE SELECT ON public.business_settings FROM anon, authenticated;

-- ─── Notes ───────────────────────────────────────────────────────────────────────
-- 1. The view is security_definer (security_invoker=false) so it bypasses the base
--    table's RLS. Since the public read RLS already allowed reading all workshops,
--    this does not weaken security — it maintains the same access level.
-- 2. Workshop-level filtering is applied in application code via
--    .eq('workshop_id', workshopId).
-- 3. The REVOKE ensures neither public nor standard admins can query the raw
--    business_settings table directly — they MUST use the view.
-- 4. Service role and postgres superuser still have full access to business_settings.
-- 5. No RLS policy is needed on the view — the view does its own column filtering.
