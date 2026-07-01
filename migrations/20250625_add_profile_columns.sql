-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Migration: Add mechanic business columns to profiles table
-- Run this in your Supabase SQL Editor before deploying the UI

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_holder text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS branch_code text,
ADD COLUMN IF NOT EXISTS hourly_rate numeric,
ADD COLUMN IF NOT EXISTS callout_fee numeric,
ADD COLUMN IF NOT EXISTS diagnostic_fee numeric,
ADD COLUMN IF NOT EXISTS terms_conditions text,
ADD COLUMN IF NOT EXISTS default_deposit_percent numeric;
