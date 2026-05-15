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