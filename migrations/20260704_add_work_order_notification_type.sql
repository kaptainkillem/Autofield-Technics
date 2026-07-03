-- 20260704_add_work_order_notification_type.sql
-- Allow notifications of type 'work_order' for the Workshop Engine.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('quote', 'appointment', 'lead', 'review', 'work_order'));
