-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Migration: Add working_hours and blocked_slots tables
-- Date: 2025-06-27
-- Author: Jey (Developer B)

-- ─── Working Hours ──────────────────────────────────────────────────────────────
CREATE TABLE public.working_hours (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(day_of_week)
);

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read working hours" ON public.working_hours FOR SELECT USING (true);
CREATE POLICY "Service role can manage working hours" ON public.working_hours FOR ALL USING (auth.role() = 'service_role');

-- ─── Blocked Slots ──────────────────────────────────────────────────────────────
CREATE TABLE public.blocked_slots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mechanic_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_datetime  TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime    TIMESTAMP WITH TIME ZONE NOT NULL,
    reason          TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage blocked slots" ON public.blocked_slots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can read blocked slots" ON public.blocked_slots FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ─── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_blocked_slots_mechanic_id ON public.blocked_slots(mechanic_id);
CREATE INDEX idx_blocked_slots_start_datetime ON public.blocked_slots(start_datetime);
CREATE INDEX idx_blocked_slots_end_datetime ON public.blocked_slots(end_datetime);
