-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Placeholder views referenced in lib/supabase.ts helpers but never created
-- These views depend on actual application data structures that may evolve.
-- Create them on the live database when the feature using them is ready.

-- CREATE VIEW IF NOT EXISTS public.v_monthly_earnings AS
-- SELECT ... 

-- CREATE VIEW IF NOT EXISTS public.v_quote_metrics AS
-- SELECT ...

-- CREATE VIEW IF NOT EXISTS public.v_review_stats AS
-- SELECT ...

-- Note: The helpers in lib/supabase.ts that reference these views
-- will fail gracefully when the views don't exist. Create the views
-- when the dashboard analytics features are ready to ship.
COMMENT ON DATABASE postgres IS 'Views v_monthly_earnings, v_quote_metrics, v_review_stats are referenced in lib/supabase.ts helpers but not yet created. See migration 20260701_create_missing_views.sql.';
