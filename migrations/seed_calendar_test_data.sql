-- DEPRECATED: All DDL is now consolidated in schema.sql (single source of truth).
-- Preserved for historical reference only.
-- Seed working hours for testing the calendar
-- Run this in your Supabase SQL Editor

INSERT INTO working_hours (day_of_week, start_time, end_time, is_active) VALUES
(1, '08:00', '17:00', true),   -- Monday
(2, '08:00', '17:00', true),   -- Tuesday
(3, '08:00', '17:00', true),   -- Wednesday
(4, '08:00', '17:00', true),   -- Thursday
(5, '08:00', '17:00', true),   -- Friday
(6, '08:00', '13:00', true),   -- Saturday
(0, '08:00', '13:00', false)   -- Sunday (closed)
ON CONFLICT (day_of_week) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_active = EXCLUDED.is_active;

-- Seed a dummy appointment for testing
INSERT INTO appointments (user_id, quote_id, service_type, scheduled_date, scheduled_time, status, notes, duration_minutes)
SELECT 
  p.id,
  NULL,
  'Brake Pad Replacement',
  '2026-06-30',
  '10:00',
  'confirmed',
  'Test appointment for calendar review',
  120
FROM profiles p
WHERE p.role = 'admin'
LIMIT 1;

-- Seed a blocked slot for testing
INSERT INTO blocked_slots (mechanic_id, start_datetime, end_datetime, reason)
SELECT 
  p.id,
  '2026-07-01T08:00:00+02:00',
  '2026-07-01T12:00:00+02:00',
  'Public Holiday - Heritage Day'
FROM profiles p
WHERE p.role = 'admin'
LIMIT 1;
