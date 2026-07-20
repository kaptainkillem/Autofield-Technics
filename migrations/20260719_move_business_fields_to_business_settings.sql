-- Migration: Move business-level fields from profiles to business_settings
-- This supports multi-deployment where each workshop has its own branding in one row (business_settings)

-- 1. Add columns to business_settings
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS account_holder TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS branch_code TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS callout_fee NUMERIC(10,2);
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS diagnostic_fee NUMERIC(10,2);
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS default_deposit_percent NUMERIC(5,2);

-- 2. Migrate data from profiles (workshop owner) to business_settings
UPDATE public.business_settings bs
SET
  company_name = p.company_name,
  logo_url = p.logo_url,
  address = p.address,
  vat_number = p.vat_number,
  registration_number = p.registration_number,
  bank_name = p.bank_name,
  account_holder = p.account_holder,
  account_number = p.account_number,
  branch_code = p.branch_code,
  terms_conditions = p.terms_conditions,
  hourly_rate = p.hourly_rate,
  callout_fee = p.callout_fee,
  diagnostic_fee = p.diagnostic_fee,
  default_deposit_percent = p.default_deposit_percent
FROM public.profiles p
JOIN public.workshops w ON w.owner_id = p.id
WHERE bs.workshop_id = w.id;

-- 3. Drop columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS logo_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS vat_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS registration_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bank_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_holder;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS branch_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS terms_conditions;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS callout_fee;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS diagnostic_fee;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS default_deposit_percent;
