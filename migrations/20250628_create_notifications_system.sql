-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Migration: Create notifications table + triggers for Persistent Inbox
-- Date: 2025-06-28
-- Targets all admin users for notifications

-- ─── Notifications Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('quote', 'appointment', 'lead', 'review', 'work_order')),
    reference_id UUID,
    title       TEXT NOT NULL,
    message     TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');

DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_created_at;

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ─── Helper: Get All Admin IDs ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_ids()
RETURNS TABLE(id UUID) AS $$
BEGIN
    RETURN QUERY SELECT p.id FROM public.profiles p WHERE p.role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Helper: Create Notification for All Admins ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_admins(
    p_workshop_id UUID,
    p_type TEXT,
    p_reference_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    admin_id UUID;
BEGIN
    FOR admin_id IN SELECT id FROM public.get_admin_ids(p_workshop_id)
    LOOP
        INSERT INTO public.notifications (user_id, workshop_id, type, reference_id, title, message)
        VALUES (admin_id, p_workshop_id, p_type, p_reference_id, p_title, p_message);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Trigger: New Quote Submitted ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_quote_insert_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_admins(
        NEW.workshop_id,
        'quote',
        NEW.id,
        'New quote request',
        COALESCE(NEW.customer_name, 'Someone') || ' requested a quote for ' || COALESCE(NEW.service_type, 'a service')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_quote_insert_notification ON public.quotes;
CREATE TRIGGER on_quote_insert_notification
    AFTER INSERT ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.on_quote_insert_notify();

-- ─── Trigger: Quote Accepted ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_quote_accepted_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        PERFORM public.notify_admins(
            NEW.workshop_id,
            'quote',
            NEW.id,
            'Quote accepted',
            COALESCE(NEW.customer_name, 'A customer') || ' accepted a quote'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_quote_update_notification ON public.quotes;
CREATE TRIGGER on_quote_update_notification
    AFTER UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.on_quote_accepted_notify();

-- ─── Trigger: New Appointment Booked ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_appointment_insert_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
    FROM public.profiles p WHERE p.id = NEW.user_id;

    PERFORM public.notify_admins(
        NEW.workshop_id,
        'appointment',
        NEW.id,
        'New appointment booked',
        customer_name || ' booked ' || COALESCE(NEW.service_type, 'a service') || ' on ' || NEW.scheduled_date
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_insert_notification ON public.appointments;
CREATE TRIGGER on_appointment_insert_notification
    AFTER INSERT ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.on_appointment_insert_notify();

-- ─── Trigger: Appointment Cancelled ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_appointment_cancelled_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.notify_admins(
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'Appointment cancelled',
            customer_name || ' cancelled their appointment on ' || NEW.scheduled_date
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_update_notification ON public.appointments;
CREATE TRIGGER on_appointment_update_notification
    AFTER UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.on_appointment_cancelled_notify();

-- ─── Trigger: New Review Submitted ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_review_insert_notify()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_admins(
        NEW.workshop_id,
        'review',
        NEW.id,
        'New review submitted',
        COALESCE(NEW.customer_name, 'A customer') || ' left a ' || NEW.rating || '-star review'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_insert_notification ON public.reviews;
CREATE TRIGGER on_review_insert_notification
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.on_review_insert_notify();

-- ─── Cleanup: Delete Notifications Older Than 60 Days ───────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Run cleanup via pg_cron (if available) or call manually
-- SELECT cron.schedule('cleanup-notifications', '0 0 * * *', 'SELECT public.cleanup_old_notifications()');
