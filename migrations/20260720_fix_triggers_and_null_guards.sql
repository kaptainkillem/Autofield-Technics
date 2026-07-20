-- Consolidated Trigger + NULL Guard Fixes — Run this in Supabase SQL Editor
-- Fixes: notifications NULL workshop_id crash + work_order trigger arg count errors

-- ═══ Drop old overloads (functions without workshop_id parameter) ═══
DROP FUNCTION IF EXISTS public.notify_admins(p_type TEXT, p_reference_id UUID, p_title TEXT, p_message TEXT);
DROP FUNCTION IF EXISTS public.notify_user(p_user_id UUID, p_type TEXT, p_reference_id UUID, p_title TEXT, p_message TEXT);

-- ═══ NULL Guards ═══

-- 1. get_admin_ids — return early if NULL workshop_id
CREATE OR REPLACE FUNCTION public.get_admin_ids(p_workshop_id UUID)
RETURNS TABLE(id UUID) AS $$
BEGIN
    IF p_workshop_id IS NULL THEN RETURN; END IF;
    RETURN QUERY SELECT p.id FROM public.profiles p
    WHERE p.role = 'admin' AND p.workshop_id = p_workshop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. notify_admins — return early if NULL workshop_id
CREATE OR REPLACE FUNCTION public.notify_admins(
    p_workshop_id UUID, p_type TEXT, p_reference_id UUID, p_title TEXT, p_message TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE admin_id UUID;
BEGIN
    IF p_workshop_id IS NULL THEN RETURN; END IF;
    FOR admin_id IN SELECT id FROM public.get_admin_ids(p_workshop_id)
    LOOP
        INSERT INTO public.notifications (user_id, workshop_id, type, reference_id, title, message)
        VALUES (admin_id, p_workshop_id, p_type, p_reference_id, p_title, p_message);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. notify_user — return early if NULL workshop_id
CREATE OR REPLACE FUNCTION public.notify_user(
    p_user_id UUID, p_workshop_id UUID, p_type TEXT, p_reference_id UUID, p_title TEXT, p_message TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    IF p_workshop_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.notifications (user_id, workshop_id, type, reference_id, title, message)
    VALUES (p_user_id, p_workshop_id, p_type, p_reference_id, p_title, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ Work Order Trigger Fixes ═══

-- 4. on_work_order_status_notify — add NEW.workshop_id
CREATE OR REPLACE FUNCTION public.on_work_order_status_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        PERFORM public.notify_user(
            (SELECT user_id FROM public.quotes WHERE id = NEW.quote_id),
            NEW.workshop_id,
            'work_order',
            NEW.id,
            CASE NEW.status
                WHEN 'in_progress' THEN 'Work has started'
                WHEN 'awaiting_parts' THEN 'Awaiting parts'
                WHEN 'ready_for_pickup' THEN 'Ready for pickup'
                WHEN 'completed' THEN 'Job completed'
                ELSE 'Work order updated'
            END,
            COALESCE(NEW.client_visible_notes, 'Your vehicle status has been updated to: ' || NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. on_work_order_revision_notify — add NEW.workshop_id
CREATE OR REPLACE FUNCTION public.on_work_order_revision_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'revision_pending' AND OLD.status != 'revision_pending' THEN
        PERFORM public.notify_user(
            (SELECT user_id FROM public.quotes WHERE id = NEW.quote_id),
            NEW.workshop_id,
            'work_order',
            NEW.id,
            'Additional work required',
            'The mechanic found additional work needed. Total: R' || NEW.additional_work_total
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. on_work_order_revision_response_notify — add NEW.workshop_id
CREATE OR REPLACE FUNCTION public.on_work_order_revision_response_notify()
RETURNS TRIGGER AS $$
DECLARE customer_name TEXT;
BEGIN
    IF NEW.revision_approved IS NOT NULL AND OLD.revision_approved IS NULL THEN
        SELECT COALESCE(p.full_name, 'A customer') INTO customer_name
        FROM public.profiles p
        WHERE p.id = (SELECT user_id FROM public.quotes WHERE id = NEW.quote_id);

        PERFORM public.notify_admins(
            NEW.workshop_id,
            'work_order',
            NEW.id,
            CASE WHEN NEW.revision_approved THEN 'Additional work accepted' ELSE 'Additional work declined' END,
            customer_name || CASE WHEN NEW.revision_approved THEN ' accepted the additional work proposal' ELSE ' declined the additional work proposal' END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ Appointment Trigger Fixes ═══

-- 7. on_appointment_proposed_notify — add NEW.workshop_id
CREATE OR REPLACE FUNCTION public.on_appointment_proposed_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'proposed' AND (
        OLD.status != 'proposed'
        OR NEW.proposed_date IS DISTINCT FROM OLD.proposed_date
        OR NEW.proposed_time IS DISTINCT FROM OLD.proposed_time
    ) THEN
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

-- 8. on_appointment_confirmed_notify — add NEW.workshop_id
CREATE OR REPLACE FUNCTION public.on_appointment_confirmed_notify()
RETURNS TRIGGER AS $$
DECLARE customer_name TEXT;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        PERFORM public.notify_user(
            NEW.user_id,
            NEW.workshop_id,
            'appointment',
            NEW.id,
            'Appointment confirmed',
            'Your appointment on ' || NEW.scheduled_date || ' at ' || COALESCE(NEW.scheduled_time, 'TBD') || ' has been confirmed'
        );

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

-- 9. on_appointment_declined_proposal_notify — add NEW.workshop_id
CREATE OR REPLACE FUNCTION public.on_appointment_declined_proposal_notify()
RETURNS TRIGGER AS $$
DECLARE customer_name TEXT;
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
