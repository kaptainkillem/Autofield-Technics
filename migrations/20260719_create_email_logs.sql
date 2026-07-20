-- Create email_logs table for tracking sent emails
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
