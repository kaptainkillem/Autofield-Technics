-- 20260703_add_unique_appointment_per_quote.sql
-- Prevents duplicate active appointments for the same quote at the database level.
-- A client can only have one active appointment (pending, proposed, or confirmed) per quote.
-- If an appointment is cancelled, the client may book again.

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_one_active_per_quote
ON public.appointments(quote_id)
WHERE status IN ('pending', 'proposed', 'confirmed') AND quote_id IS NOT NULL;
