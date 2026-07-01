-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Add missing CHECK constraints for data integrity
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_client_status_check
    CHECK (client_status IS NULL OR client_status IN ('active', 'vip', 'blacklisted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.receipts
    ADD CONSTRAINT receipts_payment_method_check
    CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Card', 'EFT'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON CONSTRAINT profiles_client_status_check ON public.profiles IS 'Valid values: active, vip, blacklisted';
COMMENT ON CONSTRAINT receipts_payment_method_check ON public.receipts IS 'Valid values: Cash, Card, EFT';
