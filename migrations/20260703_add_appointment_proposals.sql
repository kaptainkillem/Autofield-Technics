-- 20260703_add_appointment_proposals.sql
-- Adds proposal negotiation columns to appointments table
-- and triggers for proposed/confirmed status notifications

-- 1. Add proposal columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS proposed_date DATE,
  ADD COLUMN IF NOT EXISTS proposed_time TEXT,
  ADD COLUMN IF NOT EXISTS proposed_notes TEXT;

-- 2. Update the status CHECK constraint to include 'proposed'
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'proposed', 'confirmed', 'completed', 'cancelled'));

-- 3. Helper function to notify a single user
CREATE OR REPLACE FUNCTION public.notify_user(
    p_user_id UUID,
    p_workshop_id UUID,
    p_type TEXT,
    p_reference_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (user_id, workshop_id, type, reference_id, title, message)
    VALUES (p_user_id, p_workshop_id, p_type, p_reference_id, p_title, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: Appointment Proposed (notify client)
CREATE OR REPLACE FUNCTION public.on_appointment_proposed_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'proposed' AND OLD.status != 'proposed' THEN
        PERFORM public.notify_user(
            NEW.user_id,
            NEW.workshop_id,
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

-- 5. Trigger: Appointment Confirmed (notify both parties)
CREATE OR REPLACE FUNCTION public.on_appointment_confirmed_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        -- Notify client
        PERFORM public.notify_user(
            NEW.user_id,
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'Appointment confirmed',
            'Your appointment on ' || NEW.scheduled_date || ' at ' || COALESCE(NEW.scheduled_time, 'TBD') || ' has been confirmed'
        );

        -- Notify admins
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
            NEW.workshop_id,
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

-- 6. Trigger: Appointment Reverted to Pending from Proposed (notify admin)
CREATE OR REPLACE FUNCTION public.on_appointment_declined_proposal_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'pending' AND OLD.status = 'proposed' THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
            NEW.workshop_id,
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
