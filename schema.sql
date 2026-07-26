-- schema.sql — Autofield-Technics (Multi-Tenant)
-- Single source of truth — synced with live Supabase database
-- Standardized on gen_random_uuid() (Postgres native, no extension needed)
-- IDEMPOTENT: safe to run multiple times on an existing database

-- ═══════════════════════════════════════════════════════════════
-- Helper functions (JWT-based tenant isolation)
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
-- Workshops (public lookup + CI/CD)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.workshops (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    slug              TEXT NOT NULL UNIQUE,
    domain            TEXT,
    owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_email     TEXT,
    contact_phone     TEXT,
    status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    billing_status    TEXT NOT NULL DEFAULT 'paid' CHECK (billing_status IN ('paid', 'past_due', 'cancelled')),
    suspended_at      TIMESTAMPTZ,
    suspension_reason TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshops_domain ON public.workshops(domain)
  WHERE domain IS NOT NULL;

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workshops are publicly readable" ON public.workshops;
CREATE POLICY "Workshops are publicly readable" ON public.workshops
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can manage workshops" ON public.workshops;
CREATE POLICY "Super admins can manage workshops" ON public.workshops
FOR ALL USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_workshops_owner_id ON public.workshops(owner_id);
CREATE INDEX IF NOT EXISTS idx_workshops_slug     ON public.workshops(slug);

-- ═══════════════════════════════════════════════════════════════
-- Profiles (one-to-one with auth.users)
-- ═══════════════════════════════════════════════════════════════

-- ─── Users (legacy standalone business contacts) ─────────────────────────────────
-- REMOVED: public.users table dropped in favour of auth.users + public.profiles

-- ─── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id   UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL,
    icon_name     TEXT NOT NULL DEFAULT 'Wrench',
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workshop_id, slug)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Manage Categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Categories manage super admin" ON public.categories;
DROP POLICY IF EXISTS "Categories read global" ON public.categories;
DROP POLICY IF EXISTS "Categories read scoped" ON public.categories;
DROP POLICY IF EXISTS "Categories read tenant isolated" ON public.categories;
DROP POLICY IF EXISTS "Categories manage staff" ON public.categories;

CREATE POLICY "Categories read tenant isolated" ON public.categories
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    OR public.is_super_admin()
);

CREATE POLICY "Categories manage staff" ON public.categories FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
  AND (public.current_workshop_id() = workshop_id OR public.is_super_admin())
);

-- ─── Services ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id   UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    category      TEXT,
    category_id   UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    base_price    NUMERIC,
    image_url     TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active services" ON public.services;
DROP POLICY IF EXISTS "Services read tenant isolated" ON public.services;
CREATE POLICY "Services read tenant isolated" ON public.services
FOR SELECT USING (
    is_active = true
    AND (
        workshop_id = public.current_workshop_id()
        OR public.is_super_admin()
    )
);

DROP POLICY IF EXISTS "Service role can manage services" ON public.services;
DROP POLICY IF EXISTS "Services manage tenant isolated" ON public.services;
CREATE POLICY "Services manage tenant isolated" ON public.services FOR ALL USING (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
    workshop_id = public.current_workshop_id()
    AND public.current_user_role() IN ('admin', 'super_admin')
);

-- ─── Profiles (one-to-one with auth.users) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name             TEXT,
    phone                 TEXT,
    role                  TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
    onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
    workshop_id           UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
    company_name          TEXT,
    logo_url              TEXT,
    address               TEXT,
    whatsapp_number       TEXT,
    vat_number            TEXT,
    registration_number   TEXT,
    bank_name             TEXT,
    account_holder        TEXT,
    account_number        TEXT,
    branch_code           TEXT,
    hourly_rate           NUMERIC,
    callout_fee           NUMERIC,
    diagnostic_fee        NUMERIC,
    terms_conditions      TEXT,
    default_deposit_percent NUMERIC,
    alternate_phone       TEXT,
    physical_address      TEXT,
    prefers_whatsapp      BOOLEAN DEFAULT true,
    service_reminders_opt_in BOOLEAN DEFAULT true,
    client_status         TEXT DEFAULT 'active',
    internal_notes        TEXT,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_client_status_check;
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('client', 'admin', 'super_admin'));
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_client_status_check CHECK (client_status IS NULL OR client_status IN ('active', 'vip', 'blacklisted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles tenant isolated" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update own or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete own" ON public.profiles;

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

CREATE POLICY "Profiles delete own" ON public.profiles
FOR DELETE USING (auth.uid() = id);

-- ─── Vehicles ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workshop_id   UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    make          TEXT NOT NULL,
    model         TEXT NOT NULL,
    year          INT NOT NULL CHECK (year >= 1900 AND year <= 2030),
    license_plate TEXT,
    mileage       TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles tenant isolated" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles insert tenant isolated" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles update tenant isolated" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles delete tenant isolated" ON public.vehicles;

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

-- ─── Quotes ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_token         UUID DEFAULT gen_random_uuid() UNIQUE,
    user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    workshop_id         UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    customer_name       TEXT NOT NULL,
    customer_email      TEXT,
    customer_phone      TEXT NOT NULL,
    vehicle_year        INT,
    vehicle_make        TEXT,
    vehicle_model       TEXT,
    service_type        TEXT,
    description         TEXT NOT NULL,
    estimated_quote     NUMERIC,
    status              TEXT DEFAULT 'pending',
    notes               TEXT,
    pdf_url             TEXT,
    whatsapp_sent_at    TIMESTAMP WITH TIME ZONE,
    whatsapp_message_id TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP WITH TIME ZONE,
    quote_number        VARCHAR,
    line_items          JSONB NOT NULL DEFAULT '[]'::jsonb,
    discount_percent    NUMERIC NOT NULL DEFAULT 0,
    subtotal            NUMERIC NOT NULL DEFAULT 0,
    total               NUMERIC NOT NULL DEFAULT 0,
    source              VARCHAR DEFAULT 'request',
    CONSTRAINT quotes_status_check CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled'))
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can submit a quote" ON public.quotes;
DROP POLICY IF EXISTS "Service role can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Quotes tenant isolated" ON public.quotes;
DROP POLICY IF EXISTS "Quotes insert tenant isolated" ON public.quotes;
DROP POLICY IF EXISTS "Quotes update tenant isolated" ON public.quotes;
DROP POLICY IF EXISTS "Quotes delete tenant isolated" ON public.quotes;

CREATE POLICY "Quotes tenant isolated" ON public.quotes
FOR SELECT USING (
    workshop_id = public.current_workshop_id()
    AND (
        public.current_user_role() IN ('admin', 'super_admin')
        OR user_id = auth.uid()
    )
);

CREATE POLICY "Quotes insert tenant isolated" ON public.quotes
FOR INSERT WITH CHECK (
    workshop_id IS NOT NULL
    AND workshop_id = public.current_workshop_id()
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

-- ─── Reviews ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workshop_id      UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    quote_id         UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    rating           INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment          TEXT,
    customer_name    TEXT NOT NULL,
    customer_email   TEXT,
    status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderation_notes TEXT,
    approved_at      TIMESTAMP WITH TIME ZONE,
    deleted_at       TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
DROP POLICY IF EXISTS "Service role can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviews read tenant isolated" ON public.reviews;
DROP POLICY IF EXISTS "Reviews insert tenant isolated" ON public.reviews;
DROP POLICY IF EXISTS "Reviews admin tenant isolated" ON public.reviews;

CREATE POLICY "Reviews read tenant isolated" ON public.reviews
FOR SELECT USING (
    status = 'approved'
    AND deleted_at IS NULL
    AND (
        workshop_id = public.current_workshop_id()
        OR public.is_super_admin()
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

-- ─── Invoices ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workshop_id      UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    quote_id         UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    invoice_number   VARCHAR UNIQUE,
    customer_name    VARCHAR NOT NULL,
    customer_email   VARCHAR,
    customer_phone   VARCHAR,
    vehicle_year     INTEGER,
    vehicle_make     VARCHAR,
    vehicle_model    VARCHAR,
    service_type     VARCHAR,
    description      TEXT,
    line_items       JSONB NOT NULL DEFAULT '[]'::jsonb,
    discount_percent NUMERIC NOT NULL DEFAULT 0,
    subtotal         NUMERIC NOT NULL DEFAULT 0,
    total            NUMERIC NOT NULL DEFAULT 0,
    payment_method   VARCHAR,
    status           VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMPTZ
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Service role can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Invoices tenant isolated" ON public.invoices;
DROP POLICY IF EXISTS "Invoices modify tenant isolated" ON public.invoices;

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

-- ─── FAQs (global — super_admin managed) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faqs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id   UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    question      TEXT NOT NULL,
    answer        TEXT NOT NULL,
    category      TEXT DEFAULT 'general',
    display_order INT DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;
DROP POLICY IF EXISTS "FAQs manage super admin" ON public.faqs;
DROP POLICY IF EXISTS "FAQs read global" ON public.faqs;
DROP POLICY IF EXISTS "FAQs read scoped" ON public.faqs;

CREATE POLICY "FAQs read scoped" ON public.faqs
FOR SELECT USING (
  is_active = true
  AND (
    auth.uid() IS NULL
    OR workshop_id = public.current_workshop_id()
    OR workshop_id IS NULL
    OR public.is_super_admin()
  )
);

CREATE POLICY "FAQs manage staff" ON public.faqs FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
  AND (public.current_workshop_id() = workshop_id OR public.is_super_admin())
);

-- ─── Notifications (tenant-isolated) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    workshop_id  UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK (type IN ('quote', 'appointment', 'lead', 'review', 'work_order')),
    reference_id UUID,
    title        TEXT NOT NULL,
    message      TEXT,
    is_read      BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications tenant isolated" ON public.notifications;
DROP POLICY IF EXISTS "Notifications update tenant isolated" ON public.notifications;

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

-- ─── Notification Helpers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_ids(p_workshop_id UUID)
RETURNS TABLE(id UUID) AS $$
BEGIN
    IF p_workshop_id IS NULL THEN
        RETURN;
    END IF;
    RETURN QUERY SELECT p.id FROM public.profiles p
    WHERE p.role = 'admin' AND p.workshop_id = p_workshop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_admins(
    p_workshop_id UUID,
    p_type TEXT,
    p_reference_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    admin_id UUID;
BEGIN
    IF p_workshop_id IS NULL THEN
        RETURN;
    END IF;
    FOR admin_id IN SELECT id FROM public.get_admin_ids(p_workshop_id)
    LOOP
        INSERT INTO public.notifications (user_id, workshop_id, type, reference_id, title, message)
        VALUES (admin_id, p_workshop_id, p_type, p_reference_id, p_title, p_message);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_user(
    p_user_id UUID,
    p_workshop_id UUID,
    p_type TEXT,
    p_reference_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    IF p_workshop_id IS NULL THEN
        RETURN;
    END IF;
    INSERT INTO public.notifications (user_id, workshop_id, type, reference_id, title, message)
    VALUES (p_user_id, p_workshop_id, p_type, p_reference_id, p_title, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Notification Triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_quote_insert_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_admins(
        NEW.workshop_id,
        'quote',
        NEW.id,
        'New quote request',
        COALESCE(NEW.customer_name, 'Someone') || ' requested a quote for ' || COALESCE(NEW.service_type, 'a service')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_quote_insert_notification ON public.quotes;
CREATE TRIGGER on_quote_insert_notification
    AFTER INSERT ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.on_quote_insert_notify();

CREATE OR REPLACE FUNCTION public.on_quote_accepted_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        PERFORM public.notify_admins(
            NEW.workshop_id,
            'quote',
            NEW.id,
            'Quote accepted',
            COALESCE(NEW.customer_name, 'A customer') || ' accepted a quote'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_quote_update_notification ON public.quotes;
CREATE TRIGGER on_quote_update_notification
    AFTER UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.on_quote_accepted_notify();

CREATE OR REPLACE FUNCTION public.on_appointment_insert_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
    FROM public.profiles p WHERE p.id = NEW.user_id;

    PERFORM public.notify_admins(
        NEW.workshop_id,
        'appointment',
        NEW.id,
        'New appointment booked',
        customer_name || ' booked ' || COALESCE(NEW.service_type, 'a service') || ' on ' || NEW.scheduled_date
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_insert_notification ON public.appointments;
CREATE TRIGGER on_appointment_insert_notification
    AFTER INSERT ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.on_appointment_insert_notify();

CREATE OR REPLACE FUNCTION public.on_appointment_cancelled_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'Appointment cancelled',
            customer_name || ' cancelled their appointment on ' || NEW.scheduled_date
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_update_notification ON public.appointments;
CREATE TRIGGER on_appointment_update_notification
    AFTER UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.on_appointment_cancelled_notify();

CREATE OR REPLACE FUNCTION public.on_appointment_proposed_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'proposed' AND (
        OLD.status != 'proposed'
        OR NEW.proposed_date IS DISTINCT FROM OLD.proposed_date
        OR NEW.proposed_time IS DISTINCT FROM OLD.proposed_time
    ) THEN
        PERFORM public.notify_user(
            NEW.user_id,
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'New date proposed',
            'The mechanic proposed a new date for your appointment on ' || NEW.proposed_date || ' at ' || COALESCE(NEW.proposed_time, 'TBD')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_proposed_notification ON public.appointments;
CREATE TRIGGER on_appointment_proposed_notification
    AFTER UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.on_appointment_proposed_notify();

CREATE OR REPLACE FUNCTION public.on_appointment_confirmed_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        PERFORM public.notify_user(
            NEW.user_id,
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'Appointment confirmed',
            'Your appointment on ' || NEW.scheduled_date || ' at ' || COALESCE(NEW.scheduled_time, 'TBD') || ' has been confirmed'
        );

        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'Appointment confirmed',
            customer_name || '''s appointment on ' || NEW.scheduled_date || ' has been confirmed'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_confirmed_notification ON public.appointments;
CREATE TRIGGER on_appointment_confirmed_notification
    AFTER UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.on_appointment_confirmed_notify();

CREATE OR REPLACE FUNCTION public.on_appointment_declined_proposal_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'pending' AND OLD.status = 'proposed' THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'Proposal declined',
            customer_name || ' declined the proposed date. Please suggest another time.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_declined_proposal_notification ON public.appointments;
CREATE TRIGGER on_appointment_declined_proposal_notification
    AFTER UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.on_appointment_declined_proposal_notify();

CREATE OR REPLACE FUNCTION public.on_review_insert_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_admins(
        NEW.workshop_id,
        'review',
        NEW.id,
        'New review submitted',
        COALESCE(NEW.customer_name, 'A customer') || ' left a ' || NEW.rating || '-star review'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_insert_notification ON public.reviews;
CREATE TRIGGER on_review_insert_notification
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.on_review_insert_notify();

-- ─── Receipts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.receipts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id    UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quote_id       UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    invoice_number TEXT,
    amount_paid    NUMERIC NOT NULL,
    payment_method TEXT,
    job_date       DATE NOT NULL,
    notes          TEXT,
    source         TEXT DEFAULT 'system',
    customer_name  TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at     TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE public.receipts ADD CONSTRAINT receipts_payment_method_check CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Card', 'EFT'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Service role can manage receipts" ON public.receipts;
DROP POLICY IF EXISTS "Receipts tenant isolated" ON public.receipts;
DROP POLICY IF EXISTS "Receipts manage tenant scoped" ON public.receipts;
DROP POLICY IF EXISTS "Receipts update tenant isolated" ON public.receipts;

CREATE POLICY "Receipts tenant isolated" ON public.receipts
FOR SELECT USING (
  workshop_id = public.current_workshop_id()
  AND (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'super_admin'))
);

CREATE POLICY "Receipts manage tenant scoped" ON public.receipts
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS job_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- ─── Expenses ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id  UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount       NUMERIC NOT NULL CHECK (amount >= 0),
    category     TEXT NOT NULL CHECK (category IN ('Parts', 'Fuel', 'Tools', 'Rent', 'Data', 'Misc')),
    description  TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expenses tenant isolated" ON public.expenses;
DROP POLICY IF EXISTS "Expenses manage tenant scoped" ON public.expenses;
DROP POLICY IF EXISTS "Expenses update tenant isolated" ON public.expenses;

CREATE POLICY "Expenses tenant isolated" ON public.expenses
FOR SELECT USING (
  workshop_id = public.current_workshop_id()
  AND (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'super_admin'))
);

CREATE POLICY "Expenses manage tenant scoped" ON public.expenses
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- ─── Leads ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    name            TEXT,
    phone           TEXT,
    email           TEXT,
    vehicle_details TEXT,
    notes           TEXT,
    status          VARCHAR DEFAULT 'pending'
      CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage leads" ON public.leads;

CREATE POLICY "Leads tenant isolated" ON public.leads
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined'));

-- ─── SEO Registry ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seo_registry (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id      UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    path_url         TEXT NOT NULL,
    page_type        TEXT NOT NULL,
    meta_title       TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    meta_keywords    TEXT,
    h1_heading       TEXT,
    province         TEXT,
    city             TEXT,
    suburb           TEXT,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE NULLS NOT DISTINCT (workshop_id, path_url)
);

ALTER TABLE public.seo_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active SEO entries" ON public.seo_registry;
DROP POLICY IF EXISTS "Service role can manage SEO entries" ON public.seo_registry;
DROP POLICY IF EXISTS "SEO read public" ON public.seo_registry;
DROP POLICY IF EXISTS "SEO manage super admin" ON public.seo_registry;

CREATE POLICY "SEO read public" ON public.seo_registry
FOR SELECT USING (is_active = true);

CREATE POLICY "SEO manage super admin" ON public.seo_registry
FOR ALL USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ─── SEO Locations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seo_locations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id      UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    city             TEXT NOT NULL,
    suburb           TEXT NOT NULL,
    province         TEXT NOT NULL,
    meta_title       TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    h1_heading       TEXT NOT NULL,
    content_body     TEXT NOT NULL,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workshop_id, province, city, suburb)
);

ALTER TABLE public.seo_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active SEO locations" ON public.seo_locations;
DROP POLICY IF EXISTS "Service role can manage SEO locations" ON public.seo_locations;
DROP POLICY IF EXISTS "SEO locations manage super admin" ON public.seo_locations;

CREATE POLICY "SEO locations read public" ON public.seo_locations
FOR SELECT USING (is_active = true);

CREATE POLICY "SEO locations manage super admin" ON public.seo_locations
FOR ALL USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ─── Analytics ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id   UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month         INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year          INT NOT NULL,
    total_revenue NUMERIC,
    total_jobs    INT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workshop_id, user_id, month, year)
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
CREATE POLICY "Users can view own analytics" ON public.analytics FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics;
CREATE POLICY "Service role can manage analytics" ON public.analytics FOR ALL USING (auth.role() = 'service_role');

-- ─── Appointments (Jobs) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id    UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quote_id       UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    service_type   TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT,
    duration_minutes INTEGER DEFAULT 60,
    status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'confirmed', 'completed', 'cancelled')),
    customer_name  TEXT,
    notes          TEXT,
    proposed_date  DATE,
    proposed_time  TEXT,
    proposed_notes TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Service role can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Appointments tenant isolated" ON public.appointments;
DROP POLICY IF EXISTS "Appointments insert tenant isolated" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update tenant isolated" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update own" ON public.appointments;
DROP POLICY IF EXISTS "Appointments delete tenant isolated" ON public.appointments;

CREATE POLICY "Appointments tenant isolated" ON public.appointments
FOR SELECT USING (workshop_id = public.current_workshop_id() AND (public.current_user_role() IN ('admin', 'super_admin') OR user_id = auth.uid()));

CREATE POLICY "Appointments insert tenant isolated" ON public.appointments
FOR INSERT WITH CHECK (workshop_id IS NOT NULL AND workshop_id = public.current_workshop_id());

CREATE POLICY "Appointments update tenant isolated" ON public.appointments
FOR UPDATE USING (workshop_id = public.current_workshop_id() AND public.current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Appointments update own" ON public.appointments
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Appointments delete tenant isolated" ON public.appointments
FOR DELETE USING (workshop_id = public.current_workshop_id() AND public.current_user_role() IN ('admin', 'super_admin'));

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS proposed_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS proposed_time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS proposed_notes TEXT;

-- Update status constraint to include 'proposed'
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'proposed', 'confirmed', 'completed', 'cancelled'));

-- ─── Work Orders (Workshop Engine) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_orders (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id              UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    quote_id                 UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    appointment_id           UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    status                   TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'in_progress', 'awaiting_parts', 'revision_pending', 'ready_for_pickup', 'completed')),
    mechanic_notes           TEXT,
    client_visible_notes     TEXT,
    additional_work_items    JSONB NOT NULL DEFAULT '[]'::jsonb,
    additional_work_total    NUMERIC NOT NULL DEFAULT 0,
    revision_approved        BOOLEAN,
    revision_responded_at    TIMESTAMP WITH TIME ZONE,
    started_at               TIMESTAMP WITH TIME ZONE,
    completed_at             TIMESTAMP WITH TIME ZONE,
    created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Admins can manage work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Service role full access on work orders" ON public.work_orders;

CREATE POLICY "Work orders tenant isolated" ON public.work_orders
FOR SELECT USING (workshop_id = public.current_workshop_id() AND (public.current_user_role() IN ('admin', 'super_admin') OR EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = work_orders.quote_id AND q.user_id = auth.uid())));

CREATE POLICY "Work orders modify tenant isolated" ON public.work_orders
FOR ALL USING (workshop_id = public.current_workshop_id() AND public.current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Work orders update own" ON public.work_orders
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = work_orders.quote_id AND q.user_id = auth.uid()) AND workshop_id = public.current_workshop_id());

-- ─── Work Order Events (Audit Trail) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    work_order_id   UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL CHECK (event_type IN ('status_change', 'revision_submitted', 'revision_accepted', 'revision_declined', 'note_added')),
    old_status      TEXT,
    new_status      TEXT,
    notes           TEXT,
    created_by      UUID REFERENCES public.profiles(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.work_order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own work order events" ON public.work_order_events;
CREATE POLICY "Clients can view own work order events" ON public.work_order_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      JOIN public.quotes q ON q.id = wo.quote_id
      WHERE wo.id = work_order_events.work_order_id AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage work order events" ON public.work_order_events;
CREATE POLICY "Admins can manage work order events" ON public.work_order_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role full access on work order events" ON public.work_order_events;
CREATE POLICY "Service role full access on work order events" ON public.work_order_events
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger: Work Order Status Changed (notify client)
CREATE OR REPLACE FUNCTION public.on_work_order_status_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        PERFORM public.notify_user(
            (SELECT user_id FROM public.quotes WHERE id = NEW.quote_id),
            NEW.workshop_id,
            'work_order',
            NEW.id,
            CASE NEW.status
                WHEN 'in_progress' THEN 'Work has started'
                WHEN 'awaiting_parts' THEN 'Awaiting parts'
                WHEN 'ready_for_pickup' THEN 'Ready for pickup'
                WHEN 'completed' THEN 'Job completed'
                ELSE 'Work order updated'
            END,
            COALESCE(NEW.client_visible_notes, 'Your vehicle status has been updated to: ' || NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_work_order_status_notification ON public.work_orders;
CREATE TRIGGER on_work_order_status_notification
    AFTER UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.on_work_order_status_notify();

-- Trigger: Revision Submitted (notify client)
CREATE OR REPLACE FUNCTION public.on_work_order_revision_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'revision_pending' AND OLD.status != 'revision_pending' THEN
        PERFORM public.notify_user(
            (SELECT user_id FROM public.quotes WHERE id = NEW.quote_id),
            NEW.workshop_id,
            'work_order',
            NEW.id,
            'Additional work required',
            'The mechanic found additional work needed. Total: R' || NEW.additional_work_total
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_work_order_revision_notification ON public.work_orders;
CREATE TRIGGER on_work_order_revision_notification
    AFTER UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.on_work_order_revision_notify();

-- Trigger: Revision Responded (notify admins)
CREATE OR REPLACE FUNCTION public.on_work_order_revision_response_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.revision_approved IS NOT NULL AND OLD.revision_approved IS NULL THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p
        WHERE p.id = (SELECT user_id FROM public.quotes WHERE id = NEW.quote_id);

        PERFORM public.notify_admins(
            NEW.workshop_id,
            'work_order',
            NEW.id,
            CASE WHEN NEW.revision_approved THEN 'Additional work accepted' ELSE 'Additional work declined' END,
            customer_name || CASE WHEN NEW.revision_approved THEN ' accepted the additional work proposal' ELSE ' declined the additional work proposal' END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_work_order_revision_response_notification ON public.work_orders;
CREATE TRIGGER on_work_order_revision_response_notification
    AFTER UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.on_work_order_revision_response_notify();

-- ─── Working Hours ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.working_hours (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workshop_id, day_of_week)
);

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read working hours" ON public.working_hours;
CREATE POLICY "Working hours read public" ON public.working_hours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage working hours" ON public.working_hours;
CREATE POLICY "Working hours manage tenant scoped" ON public.working_hours
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
)
WITH CHECK (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- ─── Blocked Slots ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    mechanic_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_datetime  TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime    TIMESTAMP WITH TIME ZONE NOT NULL,
    reason          TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Admins can read blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Blocked slots read by workshop" ON public.blocked_slots;
DROP POLICY IF EXISTS "Blocked slots tenant isolated" ON public.blocked_slots;

CREATE POLICY "Blocked slots read by workshop" ON public.blocked_slots
FOR SELECT USING (workshop_id = public.current_workshop_id() OR public.is_super_admin());

CREATE POLICY "Blocked slots tenant isolated" ON public.blocked_slots
FOR ALL USING (workshop_id = public.current_workshop_id() AND public.current_user_role() IN ('admin', 'super_admin'));

-- ─── Auto-create profile row on signup ──────────────────────────────────────────
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Indexes ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_whatsapp_message_id ON public.quotes(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
-- Prevent duplicate active appointments per quote (one booking at a time)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_one_active_per_quote
ON public.appointments(quote_id)
WHERE status IN ('pending', 'proposed', 'confirmed') AND quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_quote_id ON public.work_orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_appointment_id ON public.work_orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_order_events_work_order_id ON public.work_order_events(work_order_id);
CREATE INDEX IF NOT EXISTS idx_seo_registry_path ON public.seo_registry(path_url);
-- Replaced by idx_seo_locations_province_city_suburb below
CREATE INDEX IF NOT EXISTS idx_analytics_user_month_year ON public.analytics(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
-- CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email); -- table removed
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON public.working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_mechanic_id ON public.blocked_slots(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_start_datetime ON public.blocked_slots(start_datetime);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_end_datetime ON public.blocked_slots(end_datetime);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_source ON public.quotes(source);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON public.faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON public.faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_locations_province_city_suburb ON public.seo_locations(province, city, suburb);

-- ─── Admin Check Function ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Business Settings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_settings (
    workshop_id         UUID PRIMARY KEY REFERENCES public.workshops(id) ON DELETE CASCADE,
    primary_color       TEXT NOT NULL DEFAULT '#3B82F6',
    accent_color        TEXT NOT NULL DEFAULT '#10B981',
    favicon_url         TEXT,
    notification_email  BOOLEAN NOT NULL DEFAULT true,
    notification_push   BOOLEAN NOT NULL DEFAULT true,
    notification_whatsapp BOOLEAN NOT NULL DEFAULT false,
    whatsapp_auto_reply TEXT,
    whatsapp_business_only BOOLEAN NOT NULL DEFAULT false,
    email_display_name  TEXT,
    email_reply_to      TEXT,
    smtp_note           TEXT,
    email_provider      TEXT DEFAULT 'resend',
    email_from          TEXT,
    admin_notification_email TEXT,
    smtp_host           TEXT,
    smtp_port           INT,
    smtp_username       TEXT,
    smtp_password       TEXT,
    smtp_secure         BOOLEAN DEFAULT true,
    -- Website Copy (editable via admin dashboard)
    site_name           TEXT DEFAULT 'Autofields Technics',
    phone               TEXT DEFAULT '+27784802796',
    whatsapp_number     TEXT,
    city                TEXT DEFAULT 'Johannesburg',
    region              TEXT,
    country             TEXT DEFAULT 'ZA',
    currency            TEXT DEFAULT 'ZAR',
    hero_title          TEXT DEFAULT 'Professional Mechanical Care, Wherever You Are',
    hero_description    TEXT DEFAULT 'From emergency roadside assistance to expert workshop repairs in {city}.',
    hero_image_url      TEXT,
    contact_email       TEXT DEFAULT 'info@autofieldstechnics.co.za',
    document_footer     TEXT,
    business_hours      TEXT,
    social_links        JSONB DEFAULT '[]'::jsonb,
    years_experience    TEXT,
    specializations     TEXT[] DEFAULT '{}',
    service_radius      TEXT DEFAULT '50km',
    business_type       TEXT DEFAULT 'mobile and workshop-based',
    experience_tagline  TEXT,
    service_tagline     TEXT DEFAULT 'Mobile + Workshop Service',
    response_time       TEXT DEFAULT '30 minutes',
    nav_links           JSONB DEFAULT '[]'::jsonb,
    footer_show_social  BOOLEAN DEFAULT true,
    footer_show_email   BOOLEAN DEFAULT true,
    footer_show_company_reg BOOLEAN DEFAULT true,
    og_image_url        TEXT,
    font_family         TEXT DEFAULT 'Inter',
    home_page_content   JSONB DEFAULT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Business settings read public" ON public.business_settings;

-- Read is now via the public_business_settings view below

CREATE POLICY "Business settings modify tenant isolated" ON public.business_settings
FOR ALL USING (
    (workshop_id = public.current_workshop_id()
     AND public.current_user_role() IN ('admin', 'super_admin'))
    OR public.is_super_admin()
);

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'Autofields Technics',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+27784802796',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Johannesburg',
  ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Professional Mechanical Care, Wherever You Are',
  ADD COLUMN IF NOT EXISTS hero_description TEXT DEFAULT 'From emergency roadside assistance to expert workshop repairs in {city}.',
  ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT 'info@autofieldstechnics.co.za',
  ADD COLUMN IF NOT EXISTS document_footer TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_holder TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS branch_code TEXT,
  ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS callout_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS diagnostic_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS default_deposit_percent NUMERIC(5,2);

-- ─── Text Colors ────────────────────────────────────────────────────────────
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS primary_text_color TEXT DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS secondary_text_color TEXT DEFAULT '#595959';

-- ─── Public Business Settings View ────────────────────────────────────────────
-- Exposes only tenant-safe columns; SMTP credentials are physically excluded.
-- Public and standard admins query this view. Super-admins use the base table.
-- View is security_definer to bypass base table RLS (same access level as before).

CREATE OR REPLACE VIEW public.public_business_settings
WITH (security_invoker = false)
AS
SELECT
  workshop_id, primary_color, accent_color, favicon_url,
  notification_email, notification_push, notification_whatsapp,
  whatsapp_auto_reply, whatsapp_business_only,
  email_display_name, email_reply_to, smtp_note,
  site_name, phone, whatsapp_number, city, region, country, currency,
  hero_title, hero_description, hero_image_url, contact_email,
  document_footer, business_hours, social_links,
  years_experience, specializations, service_radius, business_type,
  experience_tagline, service_tagline, response_time,
  nav_links, footer_show_social, footer_show_email, footer_show_company_reg,
  og_image_url, font_family, home_page_content,
  company_name, logo_url, address,
  vat_number, registration_number, bank_name, account_holder, account_number, branch_code,
  terms_conditions, hourly_rate, callout_fee, diagnostic_fee, default_deposit_percent,
  primary_text_color, secondary_text_color,
  created_at, updated_at
FROM public.business_settings;

GRANT SELECT ON public.public_business_settings TO anon, authenticated;

REVOKE SELECT ON public.business_settings FROM anon, authenticated;

-- ─── Quote Deposit & Expiry Fields ──────────────────────────────────────────────
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC(5,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- ─── Email Logs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  template_key TEXT NOT NULL,
  to_email TEXT NOT NULL,
  from_display TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their workshop email logs" ON public.email_logs
FOR SELECT USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Super admins can view all email logs" ON public.email_logs
FOR SELECT USING (public.is_super_admin());

-- ─── Email Templates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workshop_id, template_key)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage their workshop email templates" ON public.email_templates
FOR ALL USING (
  workshop_id = public.current_workshop_id()
  AND public.current_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Super admins can manage all templates" ON public.email_templates
FOR ALL USING (public.is_super_admin());

-- ─── Storage RLS Policies ──────────────────────────────────────────────────────
-- Bucket: documents (quote & invoice PDFs — admin only, customer via API route)
CREATE POLICY "Documents read by workshop admin" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (public.is_super_admin() OR (storage.foldername(name))[1] = public.current_workshop_id()::text)
);

CREATE POLICY "Documents insert by admin" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- Bucket: logos (workshop branding — public read, admin write)
CREATE POLICY "Logos read public" ON storage.objects FOR SELECT USING (
  bucket_id = 'logos'
);

CREATE POLICY "Logos insert by admin" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
);

-- Bucket: assets (website images — public read, workshop-scoped write)
CREATE POLICY "Assets read public" ON storage.objects FOR SELECT USING (
  bucket_id = 'assets'
);

CREATE POLICY "Assets insert by admin" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'assets'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
  AND (storage.foldername(name))[1] = public.current_workshop_id()::text
);

CREATE POLICY "Assets update by admin" ON storage.objects FOR UPDATE USING (
  bucket_id = 'assets'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
  AND (storage.foldername(name))[1] = public.current_workshop_id()::text
);

CREATE POLICY "Assets delete by admin" ON storage.objects FOR DELETE USING (
  bucket_id = 'assets'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
  AND (storage.foldername(name))[1] = public.current_workshop_id()::text
);

CREATE POLICY "Assets manage by super admin" ON storage.objects FOR ALL USING (
  bucket_id = 'assets'
  AND public.is_super_admin()
);
