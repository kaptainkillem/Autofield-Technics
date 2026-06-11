-- schema.sql context for OpenCode
-- Tables for Autofield-Technics

CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC,
    category TEXT -- 'workshop' or 'mobile'
);

CREATE TABLE public.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    vehicle_make_model TEXT NOT NULL,
    service_id UUID REFERENCES public.services(id),
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'accepted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES public.quotes(id),
    amount_paid NUMERIC NOT NULL,
    payment_method TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table: one-to-one with auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vehicles table: linked to profiles
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2027),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'client'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    vehicle_serviced TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public can read approved reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved reviews"
ON public.reviews FOR SELECT
USING (status = 'approved' AND deleted_at IS NULL);

-- Anyone can submit a review (no login required)
CREATE POLICY "Anyone can submit a review"
ON public.reviews FOR INSERT
WITH CHECK (true);

-- Only service role (admin) can update/approve
CREATE POLICY "Service role can update reviews"
ON public.reviews FOR UPDATE
USING (true);