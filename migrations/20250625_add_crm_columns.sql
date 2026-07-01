-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Migration: Add CRM Lite columns to profiles and vehicles tables
-- Run this in your Supabase SQL Editor before deploying the UI

-- 1. Extend existing profiles table (for Client Settings / CRM)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS alternate_phone text,
ADD COLUMN IF NOT EXISTS physical_address text,
ADD COLUMN IF NOT EXISTS prefers_whatsapp boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS service_reminders_opt_in boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS client_status text DEFAULT 'active', -- 'active', 'vip', 'blacklisted'
ADD COLUMN IF NOT EXISTS internal_notes text;

-- 2. Extend existing vehicles table (for Digital Garage)
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS license_plate text,
ADD COLUMN IF NOT EXISTS mileage text;
