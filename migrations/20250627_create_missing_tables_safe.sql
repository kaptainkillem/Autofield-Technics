-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Migration: Create missing appointments and leads tables only
-- Date: 2025-06-27
-- Note: working_hours and blocked_slots already exist from previous migration

-- ─── Appointments (Jobs) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quote_id       UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    service_type   TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT,
    status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes          TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' AND policyname = 'Users can view own appointments'
    ) THEN
        CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' AND policyname = 'Service role can manage appointments'
    ) THEN
        CREATE POLICY "Service role can manage appointments" ON public.appointments FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ─── Leads ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT,
    phone           TEXT,
    vehicle_details TEXT,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' AND policyname = 'Service role can manage leads'
    ) THEN
        CREATE POLICY "Service role can manage leads" ON public.leads FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ─── Analytics ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month         INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year          INT NOT NULL,
    total_revenue NUMERIC,
    total_jobs    INT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics' AND policyname = 'Users can view own analytics'
    ) THEN
        CREATE POLICY "Users can view own analytics" ON public.analytics FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics' AND policyname = 'Service role can manage analytics'
    ) THEN
        CREATE POLICY "Service role can manage analytics" ON public.analytics FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ─── Vehicles ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    make          TEXT NOT NULL,
    model         TEXT NOT NULL,
    year          INT NOT NULL CHECK (year >= 1900 AND year <= 2030),
    license_plate TEXT,
    mileage       TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicles' AND policyname = 'Users can view own vehicles'
    ) THEN
        CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicles' AND policyname = 'Users can insert own vehicles'
    ) THEN
        CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicles' AND policyname = 'Users can update own vehicles'
    ) THEN
        CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicles' AND policyname = 'Users can delete own vehicles'
    ) THEN
        CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ─── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 TEXT NOT NULL,
    phone                 TEXT,
    business_name         TEXT,
    whatsapp_number       TEXT,
    password_hash         TEXT,
    bio                   TEXT,
    profile_image_url     TEXT,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_reply_message    TEXT,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at            TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can view own data'
    ) THEN
        CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update own data'
    ) THEN
        CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Service role full access on users'
    ) THEN
        CREATE POLICY "Service role full access on users" ON public.users FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ─── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_month_year ON public.analytics(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
