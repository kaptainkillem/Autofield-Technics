-- Add customer_name column to appointments for walk-in / admin-created bookings
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_name TEXT;
