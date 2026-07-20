-- 20260703_fix_proposed_trigger_consecutive_proposals.sql
-- Fix the proposed notification trigger to fire on every proposal update,
-- not just the first one. This ensures clients are notified when the mechanic
-- proposes a different date after a declined proposal.

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
