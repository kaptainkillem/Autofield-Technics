-- Migration: Homepage Content Engine + Dynamic Images + Font Selection
-- Adds a JSONB column for fully editable homepage sections, workshop-scoped image
-- URLs, and a curated font-family override.

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS home_page_content JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter';

-- Backfill existing workshops with default homepage content so nothing breaks.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT workshop_id FROM public.business_settings WHERE home_page_content IS NULL LOOP
    UPDATE public.business_settings
    SET home_page_content = jsonb_build_object(
      'hero', jsonb_build_object(
        'title', 'Professional Mechanical Care, Wherever You Are',
        'description', 'From emergency roadside assistance to expert workshop repairs in {city}.',
        'primaryCtaLabel', 'Get a Free Quote',
        'primaryCtaHref', '/quote',
        'secondaryCtaLabel', 'View Our Services',
        'secondaryCtaHref', '/services',
        'showImage', true,
        'imageUrl', null
      ),
      'features', jsonb_build_object(
        'enabled', true,
        'title', '',
        'subtitle', '',
        'items', jsonb_build_array(
          jsonb_build_object(
            'heading', 'The Ultimate Driveway Workshop',
            'text', 'You don''t need to arrange a tow truck or waste your Saturday sitting in a repair shop. Our mobile units arrive at your home or office fully equipped.',
            'imageUrl', 'https://images.pexels.com/photos/4489758/pexels-photo-4489758.jpeg'
          ),
          jsonb_build_object(
            'heading', 'Transparent, Upfront Pricing',
            'text', 'Once we diagnose the issue, you receive a detailed, digital quote sent straight to your phone. We break down the exact cost of parts and labor. No hidden fees.',
            'imageUrl', 'https://images.pexels.com/photos/4116221/pexels-photo-4116221.jpeg'
          ),
          jsonb_build_object(
            'heading', 'Certified & Guaranteed Expertise',
            'text', 'Your vehicle is handled by qualified professionals with deep diagnostic experience. We back our workmanship with a comprehensive guarantee.',
            'imageUrl', 'https://images.pexels.com/photos/8478206/pexels-photo-8478206.jpeg'
          )
        )
      ),
      'howItWorks', jsonb_build_object(
        'enabled', true,
        'title', 'How It Works',
        'subtitle', 'Getting your car fixed in {city} has never been easier. Here''s how we bring the workshop to you.',
        'steps', jsonb_build_array(
          jsonb_build_object('heading', 'Get a Quote', 'description', 'Tell us your car and the problem. We give you a transparent price upfront.', 'iconName', 'MessageSquare'),
          jsonb_build_object('heading', 'We Come To You', 'description', 'We arrive at your home or office fully equipped.', 'iconName', 'Wrench'),
          jsonb_build_object('heading', 'Drive Happy', 'description', 'Your car is fixed on-site with zero towing fees or workshop waiting rooms.', 'iconName', 'Car')
        )
      ),
      'servicesGrid', jsonb_build_object(
        'enabled', true,
        'title', 'Our Services',
        'subtitle', 'Professional mobile mechanics bringing expert repairs and servicing right to your doorstep.',
        'ctaLabel', 'View All Services'
      ),
      'testimonials', jsonb_build_object(
        'enabled', true,
        'title', 'What Our Customers Say',
        'subtitle', 'Trusted by drivers across {city}.'
      ),
      'bottomCta', jsonb_build_object(
        'enabled', true,
        'heading', 'Stop waiting in workshop lobbies.',
        'description', 'Get your car fixed today right where you parked.',
        'buttonLabel', 'Get a Free Quote',
        'buttonHref', '/quote'
      ),
      'stickyCta', jsonb_build_object(
        'enabled', true,
        'title', 'Need urgent help?',
        'subtitle', 'Get a free quote in minutes.',
        'buttonLabel', 'Get a Free Quote',
        'href', '/quote'
      )
    )
    WHERE workshop_id = rec.workshop_id;
  END LOOP;
END $$;

-- Storage bucket for public website assets (hero, feature, OG images).
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on assets.
DROP POLICY IF EXISTS "Assets read public" ON storage.objects;
CREATE POLICY "Assets read public" ON storage.objects FOR SELECT USING (
  bucket_id = 'assets'
);

-- Allow admin/super-admin uploads scoped to their workshop folder.
DROP POLICY IF EXISTS "Assets insert by admin" ON storage.objects;
CREATE POLICY "Assets insert by admin" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'assets'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
  AND (storage.foldername(name))[1] = public.current_workshop_id()::text
);

-- Allow admins/super-admins to update/delete their own workshop assets.
DROP POLICY IF EXISTS "Assets update by admin" ON storage.objects;
CREATE POLICY "Assets update by admin" ON storage.objects FOR UPDATE USING (
  bucket_id = 'assets'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
  AND (storage.foldername(name))[1] = public.current_workshop_id()::text
);

DROP POLICY IF EXISTS "Assets delete by admin" ON storage.objects;
CREATE POLICY "Assets delete by admin" ON storage.objects FOR DELETE USING (
  bucket_id = 'assets'
  AND auth.role() = 'authenticated'
  AND public.current_user_role() IN ('admin', 'super_admin')
  AND (storage.foldername(name))[1] = public.current_workshop_id()::text
);

-- Super admins can manage all assets.
DROP POLICY IF EXISTS "Assets manage by super admin" ON storage.objects;
CREATE POLICY "Assets manage by super admin" ON storage.objects FOR ALL USING (
  bucket_id = 'assets'
  AND public.is_super_admin()
);
