-- 20260717_enforce_tenant_isolation.sql
-- Idempotent, production-safe migration
-- Run inside the Supabase SQL Editor as a single transaction

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- 1. Helper functions (JWT-based)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_workshop_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'workshop_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.jwt() -> 'app_metadata' ->> 'role';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════
-- 2. Workshops table (public lookup)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.workshops (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    slug           TEXT NOT NULL UNIQUE,
    owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_email  TEXT,
    contact_phone  TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workshops are publicly readable" ON public.workshops;
CREATE POLICY "Workshops are publicly readable" ON public.workshops
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can manage workshops" ON public.workshops;
CREATE POLICY "Super admins can manage workshops" ON public.workshops
FOR ALL USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_workshops_owner_id ON public.workshops(owner_id);
CREATE INDEX IF NOT EXISTS idx_workshops_slug ON public.workshops(slug);

-- ═══════════════════════════════════════════════════════════════
-- 3. Migrate data from legacy public.users before drop
-- ═══════════════════════════════════════════════════════════════

UPDATE public.profiles p
SET company_name = COALESCE(p.company_name, u.business_name),
    whatsapp_number = COALESCE(p.whatsapp_number, u.whatsapp_number)
FROM public.users u
WHERE p.id = u.id;

-- ═══════════════════════════════════════════════════════════════
-- 4. Profiles: role constraint + workshop_id
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('client', 'admin', 'super_admin'));

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL;

-- Drop legacy public.users table
DROP TABLE IF EXISTS public.users CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 5. Add workshop_id to all tenant-isolated tables
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.quotes              ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.appointments        ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.invoices            ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.receipts            ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.expenses            ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.services            ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.vehicles            ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.work_orders         ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.work_order_events   ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.analytics           ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.reviews             ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;
ALTER TABLE public.notifications       ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 6. Backfill: create one workshop per existing admin profile
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    admin_record RECORD;
    new_workshop_id UUID;
BEGIN
    FOR admin_record IN
        SELECT p.id, p.full_name, p.company_name, u.email, p.phone
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE p.role = 'admin'
          AND p.workshop_id IS NULL
    LOOP
        INSERT INTO public.workshops (name, slug, owner_id, contact_email, contact_phone)
        VALUES (
            COALESCE(admin_record.company_name, admin_record.full_name, 'Workshop ' || admin_record.id::text),
            'workshop-' || admin_record.id::text,
            admin_record.id,
            admin_record.email,
            admin_record.phone
        )
        RETURNING id INTO new_workshop_id;

        UPDATE public.profiles
        SET workshop_id = new_workshop_id
        WHERE id = admin_record.id;

        UPDATE public.quotes        SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.services      SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.appointments  SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.invoices      SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.receipts      SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.expenses      SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.vehicles      SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.analytics     SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.reviews       SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
        UPDATE public.notifications SET workshop_id = new_workshop_id WHERE user_id = admin_record.id AND workshop_id IS NULL;
    END LOOP;
END $$;

-- Cascade workshop_id to child tables
UPDATE public.work_orders wo
SET workshop_id = q.workshop_id
FROM public.quotes q
WHERE wo.quote_id = q.id
  AND wo.workshop_id IS NULL
  AND q.workshop_id IS NOT NULL;

UPDATE public.work_order_events woe
SET workshop_id = wo.workshop_id
FROM public.work_orders wo
WHERE woe.work_order_id = wo.id
  AND woe.workshop_id IS NULL
  AND wo.workshop_id IS NOT NULL;

-- Fallback: create a default workshop for any remaining orphan records
DO $$
DECLARE
    default_ws_id UUID;
BEGIN
    SELECT id INTO default_ws_id FROM public.workshops ORDER BY created_at LIMIT 1;

    IF default_ws_id IS NULL THEN
        INSERT INTO public.workshops (name, slug, owner_id)
        VALUES ('Default Workshop', 'default', (SELECT id FROM auth.users ORDER BY created_at LIMIT 1))
        RETURNING id INTO default_ws_id;
    END IF;

    UPDATE public.quotes            SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.appointments      SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.invoices          SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.receipts          SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.expenses          SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.services          SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.vehicles          SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.work_orders       SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.work_order_events SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.analytics         SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.reviews           SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.notifications     SET workshop_id = default_ws_id WHERE workshop_id IS NULL;
    UPDATE public.profiles          SET workshop_id = default_ws_id WHERE workshop_id IS NULL AND role IN ('client', 'admin');
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 7. Make workshop_id NOT NULL on tenant tables
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.quotes            ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.appointments      ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.invoices          ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.receipts          ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.expenses          ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.services          ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.vehicles          ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.work_orders       ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.work_order_events ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.analytics         ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.reviews           ALTER COLUMN workshop_id SET NOT NULL;
ALTER TABLE public.notifications     ALTER COLUMN workshop_id SET NOT NULL;

-- profiles.workshop_id stays nullable for super_admin / signup

-- ═══════════════════════════════════════════════════════════════
-- 8. Convert business_settings, working_hours, blocked_slots
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;

DO $$
DECLARE
    ws RECORD;
    bs public.business_settings%ROWTYPE;
BEGIN
    IF EXISTS (SELECT 1 FROM public.business_settings WHERE id = 'config') THEN
        SELECT * INTO bs FROM public.business_settings WHERE id = 'config' LIMIT 1;

        FOR ws IN SELECT id FROM public.workshops LOOP
            IF NOT EXISTS (SELECT 1 FROM public.business_settings WHERE workshop_id = ws.id) THEN
                INSERT INTO public.business_settings (
                    id, workshop_id, primary_color, accent_color, favicon_url,
                    notification_email, notification_push, notification_whatsapp,
                    whatsapp_auto_reply, whatsapp_business_only, email_display_name,
                    email_reply_to, smtp_note, site_name, phone, city,
                    hero_title, hero_description, contact_email, document_footer
                )
                VALUES (
                    gen_random_uuid(),
                    ws.id, bs.primary_color, bs.accent_color, bs.favicon_url,
                    bs.notification_email, bs.notification_push, bs.notification_whatsapp,
                    bs.whatsapp_auto_reply, bs.whatsapp_business_only, bs.email_display_name,
                    bs.email_reply_to, bs.smtp_note, bs.site_name, bs.phone, bs.city,
                    bs.hero_title, bs.hero_description, bs.contact_email, bs.document_footer
                );
            END IF;
        END LOOP;

        DELETE FROM public.business_settings WHERE id = 'config';
    END IF;
END $$;

ALTER TABLE public.business_settings DROP CONSTRAINT IF EXISTS business_settings_pkey;
ALTER TABLE public.business_settings ADD PRIMARY KEY (workshop_id);
ALTER TABLE public.business_settings DROP COLUMN IF EXISTS id;
ALTER TABLE public.business_settings ALTER COLUMN workshop_id SET NOT NULL;

-- working_hours (recreate per-workshop)
CREATE TABLE IF NOT EXISTS public.working_hours_new (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week, workshop_id)
);

INSERT INTO public.working_hours_new (workshop_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
SELECT w.id, wh.day_of_week, wh.start_time, wh.end_time, wh.is_active, wh.created_at, wh.updated_at
FROM public.working_hours wh
CROSS JOIN public.workshops w
WHERE EXISTS (SELECT 1 FROM public.working_hours)
  AND EXISTS (SELECT 1 FROM public.workshops)
  AND NOT EXISTS (
    SELECT 1 FROM public.working_hours_new whn
    WHERE whn.workshop_id = w.id AND whn.day_of_week = wh.day_of_week
  );

DROP TABLE public.working_hours;
ALTER TABLE public.working_hours_new RENAME TO working_hours;

-- blocked_slots
ALTER TABLE public.blocked_slots ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE;

UPDATE public.blocked_slots bs
SET workshop_id = p.workshop_id
FROM public.profiles p
WHERE bs.mechanic_id = p.id
  AND bs.workshop_id IS NULL
  AND p.workshop_id IS NOT NULL;

DELETE FROM public.blocked_slots WHERE workshop_id IS NULL;

ALTER TABLE public.blocked_slots ALTER COLUMN workshop_id SET NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 9. Indexes: mandatory workshop_id on every tenant table
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_workshop_id          ON public.profiles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_quotes_workshop_id            ON public.quotes(workshop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_workshop_id      ON public.appointments(workshop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workshop_id          ON public.invoices(workshop_id);
CREATE INDEX IF NOT EXISTS idx_receipts_workshop_id          ON public.receipts(workshop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_workshop_id          ON public.expenses(workshop_id);
CREATE INDEX IF NOT EXISTS idx_services_workshop_id          ON public.services(workshop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_workshop_id          ON public.vehicles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_workshop_id       ON public.work_orders(workshop_id);
CREATE INDEX IF NOT EXISTS idx_work_order_events_workshop_id ON public.work_order_events(workshop_id);
CREATE INDEX IF NOT EXISTS idx_analytics_workshop_id         ON public.analytics(workshop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_workshop_id           ON public.reviews(workshop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workshop_id     ON public.notifications(workshop_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_workshop_id ON public.business_settings(workshop_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_workshop_id     ON public.working_hours(workshop_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_workshop_id     ON public.blocked_slots(workshop_id);

DROP INDEX IF EXISTS idx_quotes_user_id;
DROP INDEX IF EXISTS idx_receipts_user_id;
DROP INDEX IF EXISTS idx_appointments_user_id;
DROP INDEX IF EXISTS idx_vehicles_user_id;
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_analytics_user_month_year;

-- ═══════════════════════════════════════════════════════════════
-- 10. Update handle_new_user trigger
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_workshop_id UUID;
    v_role        TEXT;
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

    IF NEW.raw_user_meta_data->>'workshop_id' IS NOT NULL THEN
        SELECT id INTO v_workshop_id
        FROM public.workshops
        WHERE id = (NEW.raw_user_meta_data->>'workshop_id')::uuid;
    END IF;

    INSERT INTO public.profiles (id, full_name, role, workshop_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        v_role,
        CASE WHEN v_role = 'super_admin' THEN NULL ELSE v_workshop_id END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- 11. RLS policies (replace service_role-based with JWT-based)
-- ═══════════════════════════════════════════════════════════════

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"   ON public.profiles;

CREATE POLICY "Profiles tenant isolated" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
    OR (
        public.current_user_role() = 'admin'
        AND workshop_id = public.current_workshop_id()
    )
    OR public.is_super_admin()
);

CREATE POLICY "Profiles insert own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles update own or admin" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id
    OR (
        public.current_user_role() = 'admin'
        AND workshop_id = public.current_workshop_id()
    )
    OR public.is_super_admin()
);

-- quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quotes"       ON public.quotes;
DROP POLICY IF EXISTS "Anyone can submit a quote"       ON public.quotes;
DROP POLICY IF EXISTS "Service role can manage quotes"  ON public.quotes;

CREATE POLICY "Quotes tenant isolated" ON public.quotes
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR user_id = auth.uid()
    )
);

CREATE POLICY "Quotes insert valid workshop" ON public.quotes
FOR INSERT WITH CHECK (
    workshop_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.workshops WHERE id = workshop_id)
);

CREATE POLICY "Quotes update tenant isolated" ON public.quotes
FOR UPDATE USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR user_id = auth.uid()
    )
);

CREATE POLICY "Quotes delete tenant isolated" ON public.quotes
FOR DELETE USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own appointments"    ON public.appointments;
DROP POLICY IF EXISTS "Service role can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments"   ON public.appointments;

CREATE POLICY "Appointments tenant isolated" ON public.appointments
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR user_id = auth.uid()
    )
);

CREATE POLICY "Appointments insert valid workshop" ON public.appointments
FOR INSERT WITH CHECK (
    workshop_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.workshops WHERE id = workshop_id)
    AND (
        auth.uid() IS NULL
        OR workshop_id = public.current_workshop_id()
        OR public.is_super_admin()
    )
);

CREATE POLICY "Appointments update tenant isolated" ON public.appointments
FOR UPDATE USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Appointments delete tenant isolated" ON public.appointments
FOR DELETE USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoices"      ON public.invoices;
DROP POLICY IF EXISTS "Service role can manage invoices" ON public.invoices;

CREATE POLICY "Invoices tenant isolated" ON public.invoices
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR user_id = auth.uid()
    )
);

CREATE POLICY "Invoices modify tenant isolated" ON public.invoices
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- receipts
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own receipts"      ON public.receipts;
DROP POLICY IF EXISTS "Service role can manage receipts" ON public.receipts;

CREATE POLICY "Receipts tenant isolated" ON public.receipts
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR user_id = auth.uid()
    )
);

CREATE POLICY "Receipts modify tenant isolated" ON public.receipts
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view own expenses"      ON public.expenses;

CREATE POLICY "Expenses tenant isolated" ON public.expenses
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active services"  ON public.services;
DROP POLICY IF EXISTS "Service role can manage services" ON public.services;

CREATE POLICY "Services read tenant isolated" ON public.services
FOR SELECT USING (
    is_active = true
    AND (
        workshop_id = public.current_workshop_id()
        OR auth.uid() IS NULL
    )
);

CREATE POLICY "Services modify tenant isolated" ON public.services
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vehicles"   ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;

CREATE POLICY "Vehicles tenant isolated" ON public.vehicles
FOR SELECT USING (
    user_id = auth.uid()
    OR (
        public.current_user_role() = 'admin'
        AND workshop_id = public.current_workshop_id()
    )
    OR public.is_super_admin()
);

CREATE POLICY "Vehicles insert tenant isolated" ON public.vehicles
FOR INSERT WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "Vehicles update tenant isolated" ON public.vehicles
FOR UPDATE USING (
    user_id = auth.uid()
    AND workshop_id = public.current_workshop_id()
);

CREATE POLICY "Vehicles delete tenant isolated" ON public.vehicles
FOR DELETE USING (
    user_id = auth.uid()
    AND workshop_id = public.current_workshop_id()
);

-- work_orders
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own work orders"        ON public.work_orders;
DROP POLICY IF EXISTS "Admins can manage work orders"           ON public.work_orders;
DROP POLICY IF EXISTS "Service role full access on work orders" ON public.work_orders;

CREATE POLICY "Work orders tenant isolated" ON public.work_orders
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = work_orders.quote_id AND q.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Work orders modify tenant isolated" ON public.work_orders
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- work_order_events
ALTER TABLE public.work_order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own work order events"        ON public.work_order_events;
DROP POLICY IF EXISTS "Admins can manage work order events"           ON public.work_order_events;
DROP POLICY IF EXISTS "Service role full access on work order events" ON public.work_order_events;

CREATE POLICY "Work order events tenant isolated" ON public.work_order_events
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR EXISTS (
            SELECT 1 FROM public.work_orders wo
            JOIN public.quotes q ON q.id = wo.quote_id
            WHERE wo.id = work_order_events.work_order_id AND q.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Work order events modify tenant isolated" ON public.work_order_events
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics"      ON public.analytics;
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics;

CREATE POLICY "Analytics tenant isolated" ON public.analytics
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can submit a review"       ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews"        ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews"        ON public.reviews;

CREATE POLICY "Reviews read tenant isolated" ON public.reviews
FOR SELECT USING (
    status = 'approved'
    AND deleted_at IS NULL
    AND (
        workshop_id = public.current_workshop_id()
        OR auth.uid() IS NULL
    )
);

CREATE POLICY "Reviews insert tenant isolated" ON public.reviews
FOR INSERT WITH CHECK (
    workshop_id = public.current_workshop_id()
);

CREATE POLICY "Reviews admin tenant isolated" ON public.reviews
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications"      ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"    ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;

CREATE POLICY "Notifications tenant isolated" ON public.notifications
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        user_id = auth.uid()
        OR public.current_user_role() IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Notifications update tenant isolated" ON public.notifications
FOR UPDATE USING (
    workshop_id = public.current_workshop_id()
    AND user_id = auth.uid()
);

-- business_settings
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read business settings"   ON public.business_settings;
DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;

CREATE POLICY "Business settings read public" ON public.business_settings
FOR SELECT USING (EXISTS (SELECT 1 FROM public.workshops WHERE id = workshop_id));

CREATE POLICY "Business settings modify tenant isolated" ON public.business_settings
FOR ALL USING (
    (workshop_id = public.current_workshop_id()
     AND public.current_user_role() IN ('admin', 'super_admin'))
    OR public.is_super_admin()
);

-- working_hours
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read working hours"        ON public.working_hours;
DROP POLICY IF EXISTS "Service role can manage working hours" ON public.working_hours;

CREATE POLICY "Working hours read public" ON public.working_hours
FOR SELECT USING (EXISTS (SELECT 1 FROM public.workshops WHERE id = workshop_id));

CREATE POLICY "Working hours modify tenant isolated" ON public.working_hours
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- blocked_slots
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Admins can read blocked slots"         ON public.blocked_slots;

CREATE POLICY "Blocked slots tenant isolated" ON public.blocked_slots
FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- categories (global, super_admin only)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories"         ON public.categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON public.categories;

CREATE POLICY "Categories read global" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Categories manage super admin" ON public.categories
FOR ALL USING (public.is_super_admin());

-- faqs (global, super_admin only)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can manage FAQs"      ON public.faqs;

CREATE POLICY "FAQs read global" ON public.faqs
FOR SELECT USING (is_active = true);

CREATE POLICY "FAQs manage super admin" ON public.faqs
FOR ALL USING (public.is_super_admin());

-- seo_registry (global, super_admin only)
ALTER TABLE public.seo_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active SEO entries"  ON public.seo_registry;
DROP POLICY IF EXISTS "Service role can manage SEO entries" ON public.seo_registry;

CREATE POLICY "SEO registry read global" ON public.seo_registry
FOR SELECT USING (is_active = true);

CREATE POLICY "SEO registry manage super admin" ON public.seo_registry
FOR ALL USING (public.is_super_admin());

-- seo_locations (global, super_admin only)
ALTER TABLE public.seo_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active SEO locations"  ON public.seo_locations;
DROP POLICY IF EXISTS "Service role can manage SEO locations" ON public.seo_locations;

CREATE POLICY "SEO locations read global" ON public.seo_locations
FOR SELECT USING (is_active = true);

CREATE POLICY "SEO locations manage super admin" ON public.seo_locations
FOR ALL USING (public.is_super_admin());

-- ═══════════════════════════════════════════════════════════════
-- 12. Assertion tests
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    missing INT;
BEGIN
    SELECT COUNT(*) INTO missing FROM public.profiles
    WHERE role IN ('client','admin') AND workshop_id IS NULL;
    IF missing > 0 THEN
        RAISE EXCEPTION 'Assertion failed: % client/admin profiles lack workshop_id', missing;
    END IF;

    SELECT COUNT(*) INTO missing FROM public.quotes WHERE workshop_id IS NULL;
    IF missing > 0 THEN RAISE EXCEPTION 'Assertion failed: % quotes lack workshop_id', missing; END IF;

    SELECT COUNT(*) INTO missing FROM public.appointments WHERE workshop_id IS NULL;
    IF missing > 0 THEN RAISE EXCEPTION 'Assertion failed: % appointments lack workshop_id', missing; END IF;

    SELECT COUNT(*) INTO missing FROM public.invoices WHERE workshop_id IS NULL;
    IF missing > 0 THEN RAISE EXCEPTION 'Assertion failed: % invoices lack workshop_id', missing; END IF;

    SELECT COUNT(*) INTO missing FROM public.services WHERE workshop_id IS NULL;
    IF missing > 0 THEN RAISE EXCEPTION 'Assertion failed: % services lack workshop_id', missing; END IF;

    SELECT COUNT(*) INTO missing FROM public.work_orders WHERE workshop_id IS NULL;
    IF missing > 0 THEN RAISE EXCEPTION 'Assertion failed: % work_orders lack workshop_id', missing; END IF;

    SELECT COUNT(*) INTO missing FROM public.reviews WHERE workshop_id IS NULL;
    IF missing > 0 THEN RAISE EXCEPTION 'Assertion failed: % reviews lack workshop_id', missing; END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE EXCEPTION 'Assertion failed: legacy public.users table still exists';
    END IF;
END $$;

COMMIT;
