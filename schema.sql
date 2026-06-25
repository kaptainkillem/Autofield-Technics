-- schema.sql — Autofield-Technics
-- Fully synced with types/database.ts

-- ─── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users (standalone business contacts) ─────────────────────────────────────
CREATE TABLE public.users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT NOT NULL,
    phone         TEXT,
    business_name TEXT,
    whatsapp_number TEXT,
    password_hash TEXT,
    bio           TEXT,
    profile_image_url TEXT,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_reply_message TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at    TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access on users" ON public.users FOR ALL USING (auth.role() = 'service_role');

-- ─── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE public.categories (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    icon_name     TEXT,
    display_order INT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Service role can manage categories" ON public.categories FOR ALL USING (auth.role() = 'service_role');

-- ─── Services ───────────────────────────────────────────────────────────────────
CREATE TABLE public.services (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE POLICY "Anyone can read active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage services" ON public.services FOR ALL USING (auth.role() = 'service_role');

-- ─── Profiles (one-to-one with auth.users) ─────────────────────────────────────
CREATE TABLE public.profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name           TEXT,
    phone               TEXT,
    role                TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ─── Vehicles ───────────────────────────────────────────────────────────────────
CREATE TABLE public.vehicles (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    make       TEXT NOT NULL,
    model      TEXT NOT NULL,
    year       INT NOT NULL CHECK (year >= 1900 AND year <= 2030),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- ─── Quotes ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.quotes (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name  TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    vehicle_year   INT,
    vehicle_make   TEXT,
    vehicle_model  TEXT,
    description    TEXT,
    status         TEXT DEFAULT 'pending',
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at     TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Anyone can submit a quote" ON public.quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage quotes" ON public.quotes FOR ALL USING (auth.role() = 'service_role');

-- ─── Reviews ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quote_id         UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    customer_name    TEXT NOT NULL,
    customer_email   TEXT,
    rating           INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment          TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderation_notes TEXT,
    approved_at      TIMESTAMP WITH TIME ZONE,
    deleted_at       TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved reviews" ON public.reviews FOR SELECT USING (status = 'approved' AND deleted_at IS NULL);
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update reviews" ON public.reviews FOR UPDATE USING (true);

-- ─── Receipts ────────────────────────────────────────────────────────────────────
CREATE TABLE public.receipts (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quote_id       UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    amount_paid    NUMERIC NOT NULL,
    payment_method TEXT,
    job_date       DATE,
    issued_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at     TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Service role can manage receipts" ON public.receipts FOR ALL USING (auth.role() = 'service_role');

-- ─── Leads ───────────────────────────────────────────────────────────────────────
CREATE TABLE public.leads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT,
    phone           TEXT,
    vehicle_details TEXT,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage leads" ON public.leads FOR ALL USING (auth.role() = 'service_role');

-- ─── SEO Registry ───────────────────────────────────────────────────────────────
CREATE TABLE public.seo_registry (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path_url        TEXT NOT NULL UNIQUE,
    page_type       TEXT DEFAULT 'landing',
    meta_title      TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    meta_keywords   TEXT NOT NULL,
    h1_heading      TEXT NOT NULL,
    province        TEXT,
    city            TEXT,
    suburb          TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.seo_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active SEO entries" ON public.seo_registry FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage SEO entries" ON public.seo_registry FOR ALL USING (auth.role() = 'service_role');

-- ─── Analytics ───────────────────────────────────────────────────────────────────
CREATE TABLE public.analytics (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE POLICY "Users can view own analytics" ON public.analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage analytics" ON public.analytics FOR ALL USING (auth.role() = 'service_role');

-- ─── Appointments (Jobs) ────────────────────────────────────────────────────────
CREATE TABLE public.appointments (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage appointments" ON public.appointments FOR ALL USING (auth.role() = 'service_role');

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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Indexes ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX idx_seo_registry_path ON public.seo_registry(path_url);
CREATE INDEX idx_analytics_user_month_year ON public.analytics(user_id, month, year);
CREATE INDEX idx_services_category_id ON public.services(category_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_reviews_status ON public.reviews(status);