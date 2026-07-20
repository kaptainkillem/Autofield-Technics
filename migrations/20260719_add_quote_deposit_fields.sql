-- Add deposit and expiry fields to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC(5,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS expiry_date DATE;
