-- Editable email templates per workshop
-- Override rows take precedence over hardcoded defaults
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
