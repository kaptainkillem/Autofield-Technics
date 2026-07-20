-- 20260703_create_work_orders.sql
-- Workshop Engine: work_orders table, audit trail, RLS policies, indexes, and notifications

-- ─── Work Orders (Workshop Engine) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_orders (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id                 UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    appointment_id           UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    status                   TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'in_progress', 'awaiting_parts', 'revision_pending', 'ready_for_pickup', 'completed')),
    mechanic_notes           TEXT,
    client_visible_notes     TEXT,
    additional_work_items    JSONB NOT NULL DEFAULT '[]'::jsonb,
    additional_work_total    NUMERIC NOT NULL DEFAULT 0,
    revision_approved        BOOLEAN,
    revision_responded_at    TIMESTAMP WITH TIME ZONE,
    started_at               TIMESTAMP WITH TIME ZONE,
    completed_at             TIMESTAMP WITH TIME ZONE,
    created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own work orders" ON public.work_orders;
CREATE POLICY "Clients can view own work orders" ON public.work_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = work_orders.quote_id AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage work orders" ON public.work_orders;
CREATE POLICY "Admins can manage work orders" ON public.work_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role full access on work orders" ON public.work_orders;
CREATE POLICY "Service role full access on work orders" ON public.work_orders
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Work Order Events (Audit Trail) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL CHECK (event_type IN ('status_change', 'revision_submitted', 'revision_accepted', 'revision_declined', 'note_added')),
    old_status      TEXT,
    new_status      TEXT,
    notes           TEXT,
    created_by      UUID REFERENCES public.profiles(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.work_order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own work order events" ON public.work_order_events;
CREATE POLICY "Clients can view own work order events" ON public.work_order_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      JOIN public.quotes q ON q.id = wo.quote_id
      WHERE wo.id = work_order_events.work_order_id AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage work order events" ON public.work_order_events;
CREATE POLICY "Admins can manage work order events" ON public.work_order_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role full access on work order events" ON public.work_order_events;
CREATE POLICY "Service role full access on work order events" ON public.work_order_events
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_work_orders_quote_id ON public.work_orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_appointment_id ON public.work_orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_order_events_work_order_id ON public.work_order_events(work_order_id);

-- ─── Notification Triggers ──────────────────────────────────────────────────────
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

DROP TRIGGER IF EXISTS on_work_order_status_notification ON public.work_orders;
CREATE TRIGGER on_work_order_status_notification
    AFTER UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.on_work_order_status_notify();

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

DROP TRIGGER IF EXISTS on_work_order_revision_notification ON public.work_orders;
CREATE TRIGGER on_work_order_revision_notification
    AFTER UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.on_work_order_revision_notify();

CREATE OR REPLACE FUNCTION public.on_work_order_revision_response_notify()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
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

DROP TRIGGER IF EXISTS on_work_order_revision_response_notification ON public.work_orders;
CREATE TRIGGER on_work_order_revision_response_notification
    AFTER UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.on_work_order_revision_response_notify();
