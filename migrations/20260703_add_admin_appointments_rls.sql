-- 20260703_add_admin_appointments_rls.sql
-- Allow admin users to view all appointments via the browser client.
-- Without this, admins can only see appointments where user_id = auth.uid(),
-- which means client bookings are invisible on the admin calendar.

CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
