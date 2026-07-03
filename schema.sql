-- schema.sql — Autofield-Technics
-- Single source of truth — synced with live Supabase database
-- Standardized on gen_random_uuid() (Postgres native, no extension needed)
-- IDEMPOTENT: safe to run multiple times on an existing database

-- ─── Users (standalone business contacts) ─────────────────────────────────────
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

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
CREATE POLICY "Service role full access on users" ON public.users FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_message TEXT;

-- ─── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    icon_name     TEXT NOT NULL DEFAULT 'Wrench',
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage categories" ON public.categories;
CREATE POLICY "Service role can manage categories" ON public.categories FOR ALL USING (auth.role() = 'service_role');

-- ─── Services ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE POLICY "Anyone can read active services" ON public.services FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage services" ON public.services;
CREATE POLICY "Service role can manage services" ON public.services FOR ALL USING (auth.role() = 'service_role');

-- ─── Profiles (one-to-one with auth.users) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name             TEXT,
    phone                 TEXT,
    role                  TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
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
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_client_status_check CHECK (client_status IS NULL OR client_status IN ('active', 'vip', 'blacklisted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CRM & business columns (safe re-add on existing DBs)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_holder TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS branch_code TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS callout_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS diagnostic_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
  ADD COLUMN IF NOT EXISTS default_deposit_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS physical_address TEXT,
  ADD COLUMN IF NOT EXISTS prefers_whatsapp BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS service_reminders_opt_in BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS client_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Client notification preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_quotes_whatsapp BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_appointments_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_marketing BOOLEAN DEFAULT false;

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

DROP POLICY IF EXISTS "Users can view own vehicles" ON public.vehicles;
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- ─── Quotes ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can submit a quote" ON public.quotes;
CREATE POLICY "Anyone can submit a quote" ON public.quotes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage quotes" ON public.quotes;
CREATE POLICY "Service role can manage quotes" ON public.quotes FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_number VARCHAR,
  ADD COLUMN IF NOT EXISTS line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'request',
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

DO $$ BEGIN
  ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS status_valid;
  ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
  ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check
    CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN
  ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
  ALTER TABLE public.quotes ADD CONSTRAINT quotes_status_check
    CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled'));
END $$;

-- ─── Reviews ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
CREATE POLICY "Anyone can read approved reviews" ON public.reviews FOR SELECT USING (status = 'approved' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can update reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Invoices ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Service role can manage invoices" ON public.invoices;
CREATE POLICY "Service role can manage invoices" ON public.invoices FOR ALL USING (auth.role() = 'service_role');

-- ─── FAQs ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faqs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE POLICY "Anyone can read active FAQs" ON public.faqs FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;
CREATE POLICY "Admins can manage FAQs" ON public.faqs FOR ALL USING (public.is_admin());

-- ─── Notifications ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK (type IN ('quote', 'appointment', 'lead', 'review', 'work_order')),
    reference_id UUID,
    title        TEXT NOT NULL,
    message      TEXT,
    is_read      BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;
CREATE POLICY "Service role can manage notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');

-- ─── Notification Helpers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_ids()
RETURNS TABLE(id UUID) AS $$
BEGIN
    RETURN QUERY SELECT p.id FROM public.profiles p WHERE p.role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_admins(
    p_type TEXT,
    p_reference_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    admin_id UUID;
BEGIN
    FOR admin_id IN SELECT id FROM public.get_admin_ids()
    LOOP
        INSERT INTO public.notifications (user_id, type, reference_id, title, message)
        VALUES (admin_id, p_type, p_reference_id, p_title, p_message);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Notification Triggers ───────────────────────────────────────────────────────
-- Trigger: New Quote Submitted
CREATE OR REPLACE FUNCTION public.on_quote_insert_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_admins(
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

-- Trigger: Quote Accepted
CREATE OR REPLACE FUNCTION public.on_quote_accepted_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        PERFORM public.notify_admins(
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

-- Trigger: New Appointment Booked
CREATE OR REPLACE FUNCTION public.on_appointment_insert_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
    FROM public.profiles p WHERE p.id = NEW.user_id;

    PERFORM public.notify_admins(
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

-- Trigger: Appointment Cancelled
CREATE OR REPLACE FUNCTION public.on_appointment_cancelled_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
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

-- Helper function to notify a single user
CREATE OR REPLACE FUNCTION public.notify_user(
    p_user_id UUID,
    p_type TEXT,
    p_reference_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, reference_id, title, message)
    VALUES (p_user_id, p_type, p_reference_id, p_title, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Appointment Proposed (notify client)
-- Fires when status becomes 'proposed' OR when proposed fields change on an already-proposed appointment
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

-- Trigger: Appointment Confirmed (notify both parties)
CREATE OR REPLACE FUNCTION public.on_appointment_confirmed_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        PERFORM public.notify_user(
            NEW.user_id,
            'appointment',
            NEW.id,
            'Appointment confirmed',
            'Your appointment on ' || NEW.scheduled_date || ' at ' || COALESCE(NEW.scheduled_time, 'TBD') || ' has been confirmed'
        );

        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
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

-- Trigger: Proposal Declined (notify admin)
CREATE OR REPLACE FUNCTION public.on_appointment_declined_proposal_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'pending' AND OLD.status = 'proposed' THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
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

-- Trigger: New Review Submitted
CREATE OR REPLACE FUNCTION public.on_review_insert_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_admins(
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
CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Service role can manage receipts" ON public.receipts;
CREATE POLICY "Service role can manage receipts" ON public.receipts FOR ALL USING (auth.role() = 'service_role');

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
CREATE POLICY "Service role can manage expenses" ON public.expenses FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);

-- ─── Leads ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE POLICY "Service role can manage leads" ON public.leads FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined'));

-- ─── SEO Registry ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seo_registry (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_url         TEXT NOT NULL UNIQUE,
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
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.seo_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active SEO entries" ON public.seo_registry;
CREATE POLICY "Anyone can read active SEO entries" ON public.seo_registry FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage SEO entries" ON public.seo_registry;
CREATE POLICY "Service role can manage SEO entries" ON public.seo_registry FOR ALL USING (auth.role() = 'service_role');

-- ─── SEO Locations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seo_locations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city             TEXT NOT NULL,
    suburb           TEXT NOT NULL,
    province         TEXT NOT NULL,
    meta_title       TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    h1_heading       TEXT NOT NULL,
    content_body     TEXT NOT NULL,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.seo_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active SEO locations" ON public.seo_locations;
CREATE POLICY "Anyone can read active SEO locations" ON public.seo_locations FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage SEO locations" ON public.seo_locations;
CREATE POLICY "Service role can manage SEO locations" ON public.seo_locations FOR ALL USING (auth.role() = 'service_role');

-- ─── Analytics ───────────────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
CREATE POLICY "Users can view own analytics" ON public.analytics FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics;
CREATE POLICY "Service role can manage analytics" ON public.analytics FOR ALL USING (auth.role() = 'service_role');

-- ─── Appointments (Jobs) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage appointments" ON public.appointments;
CREATE POLICY "Service role can manage appointments" ON public.appointments FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

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
CREATE POLICY "Clients can view own work orders" ON public.work_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = work_orders.quote_id AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage work orders" ON public.work_orders;
CREATE POLICY "Admins can manage work orders" ON public.work_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role full access on work orders" ON public.work_orders;
CREATE POLICY "Service role full access on work orders" ON public.work_orders
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Work Order Events (Audit Trail) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(day_of_week)
);

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read working hours" ON public.working_hours;
CREATE POLICY "Anyone can read working hours" ON public.working_hours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage working hours" ON public.working_hours;
CREATE POLICY "Service role can manage working hours" ON public.working_hours FOR ALL USING (auth.role() = 'service_role');

-- ─── Blocked Slots ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_datetime  TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime    TIMESTAMP WITH TIME ZONE NOT NULL,
    reason          TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage blocked slots" ON public.blocked_slots;
CREATE POLICY "Service role can manage blocked slots" ON public.blocked_slots FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can read blocked slots" ON public.blocked_slots;
CREATE POLICY "Admins can read blocked slots" ON public.blocked_slots FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ─── Auto-create profile row on signup ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Always create new users as clients. Admins must be promoted via service role.
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'client'
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
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
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
    id                  TEXT PRIMARY KEY DEFAULT 'config',
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
    -- Website Copy (editable via admin dashboard)
    site_name           TEXT DEFAULT 'Autofields Technics',
    phone               TEXT DEFAULT '+27784802796',
    city                TEXT DEFAULT 'Johannesburg',
    hero_title          TEXT DEFAULT 'Professional Mechanical Care, Wherever You Are',
    hero_description    TEXT DEFAULT 'From emergency roadside assistance to expert workshop repairs in {city}.',
    contact_email       TEXT DEFAULT 'info@autofieldstechnics.co.za',
    document_footer     TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read business settings" ON public.business_settings;
CREATE POLICY "Anyone can read business settings" ON public.business_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;
CREATE POLICY "Admins can manage business settings" ON public.business_settings FOR ALL USING (public.is_admin());

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'Autofields Technics',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+27784802796',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Johannesburg',
  ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Professional Mechanical Care, Wherever You Are',
  ADD COLUMN IF NOT EXISTS hero_description TEXT DEFAULT 'From emergency roadside assistance to expert workshop repairs in {city}.',
  ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT 'info@autofieldstechnics.co.za',
  ADD COLUMN IF NOT EXISTS document_footer TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
