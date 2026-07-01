-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Migration: Create business_settings and faqs tables for Week 5
-- Date: 2025-06-28

-- ─── Business Settings (Single-row configuration table) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.business_settings (
    id                       TEXT PRIMARY KEY DEFAULT 'config',
    primary_color            TEXT NOT NULL DEFAULT '#3B82F6',
    accent_color             TEXT NOT NULL DEFAULT '#10B981',
    favicon_url              TEXT,
    email_display_name       TEXT DEFAULT 'Autofield Technics',
    email_reply_to           TEXT DEFAULT 'info@autofieldstechnics.co.za',
    whatsapp_auto_reply      TEXT,
    whatsapp_business_only   BOOLEAN NOT NULL DEFAULT false,
    notification_email       BOOLEAN NOT NULL DEFAULT true,
    notification_push        BOOLEAN NOT NULL DEFAULT true,
    notification_whatsapp    BOOLEAN NOT NULL DEFAULT false,
    smtp_note                TEXT DEFAULT 'SMTP configuration is managed via Environment Variables.',
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;
CREATE POLICY "Admins can manage business settings" ON public.business_settings FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Anyone can read business settings" ON public.business_settings;
CREATE POLICY "Anyone can read business settings" ON public.business_settings FOR SELECT USING (true);

-- Insert default config row
INSERT INTO public.business_settings (id, primary_color, accent_color)
VALUES ('config', '#3B82F6', '#10B981')
ON CONFLICT (id) DO NOTHING;

-- ─── FAQs Table ────────────────────────────────────────────────────────────────
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
CREATE POLICY "Admins can manage FAQs" ON public.faqs FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_display_order ON public.faqs(display_order);
CREATE INDEX idx_faqs_is_active ON public.faqs(is_active);

-- Seed sample FAQs
INSERT INTO public.faqs (question, answer, category, display_order)
VALUES
  ('What areas do you service?', 'We provide mobile mechanic services across the greater Johannesburg area, including Sandton, Midrand, Randburg, and Pretoria. Our workshop is located in Marshalltown for drop-off repairs.', 'general', 1),
  ('Do I need to book an appointment?', 'For workshop services, appointments are recommended. For mobile call-outs, we aim to respond within 30 minutes during business hours. You can book online through our dashboard.', 'booking', 2),
  ('What payment methods do you accept?', 'We accept cash, EFT, and all major credit cards. Payment is due on completion of the job unless prior arrangements have been made.', 'payments', 3),
  ('Do you offer a warranty on repairs?', 'Yes, all our repairs come with a 3-month warranty on parts and labour. Warranty claims must be reported within the warranty period.', 'general', 4),
  ('Can you service Korean car brands?', 'Absolutely. We specialize in Korean brands including Hyundai, Kia, and Suzuki. Our lead mechanic has 15+ years of experience with these vehicles.', 'services', 5)
ON CONFLICT DO NOTHING;
