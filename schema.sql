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

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Client notification preferences (added for Client Settings portal)
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
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    whatsapp_sent_at    TIMESTAMP WITH TIME ZONE,
    whatsapp_message_id TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can submit a quote" ON public.quotes;
CREATE POLICY "Anyone can submit a quote" ON public.quotes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage quotes" ON public.quotes;
CREATE POLICY "Service role can manage quotes" ON public.quotes FOR ALL USING (auth.role() = 'service_role');

-- ─── Reviews ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
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

DROP POLICY IF EXISTS "Service role can update reviews" ON public.reviews;
CREATE POLICY "Service role can update reviews" ON public.reviews FOR UPDATE USING (true);

-- ─── Receipts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.receipts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
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

DROP POLICY IF EXISTS "Users can view own receipts" ON public.receipts;
CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Service role can manage receipts" ON public.receipts;
CREATE POLICY "Service role can manage receipts" ON public.receipts FOR ALL USING (auth.role() = 'service_role');

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
    vehicle_details TEXT,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage leads" ON public.leads;
CREATE POLICY "Service role can manage leads" ON public.leads FOR ALL USING (auth.role() = 'service_role');

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
    status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes          TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage appointments" ON public.appointments;
CREATE POLICY "Service role can manage appointments" ON public.appointments FOR ALL USING (auth.role() = 'service_role');

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
DECLARE
    user_role TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        user_role
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
CREATE INDEX IF NOT EXISTS idx_seo_registry_path ON public.seo_registry(path_url);
CREATE INDEX IF NOT EXISTS idx_seo_locations_path_url ON public.seo_locations(id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_month_year ON public.analytics(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON public.working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_mechanic_id ON public.blocked_slots(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_start_datetime ON public.blocked_slots(start_datetime);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_end_datetime ON public.blocked_slots(end_datetime);

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
    primary_color       TEXT DEFAULT '#3B82F6',
    accent_color        TEXT DEFAULT '#10B981',
    favicon_url         TEXT,
    notification_email  BOOLEAN DEFAULT true,
    notification_push   BOOLEAN DEFAULT true,
    notification_whatsapp BOOLEAN DEFAULT false,
    whatsapp_auto_reply TEXT,
    whatsapp_business_only BOOLEAN DEFAULT false,
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
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read business settings" ON public.business_settings;
CREATE POLICY "Anyone can read business settings" ON public.business_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;
CREATE POLICY "Admins can manage business settings" ON public.business_settings FOR ALL USING (public.is_admin());
