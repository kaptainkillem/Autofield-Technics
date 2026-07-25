-- Migration: Phase 4 — Default working hours and email templates for new workshops
-- Seeds out-of-the-box defaults so every workshop is operational on day one.

-- Backfill existing workshops that lack working hours.
DO $$
DECLARE
  rec RECORD;
  existing_count INT;
BEGIN
  FOR rec IN SELECT id FROM public.workshops LOOP
    SELECT COUNT(*) INTO existing_count FROM public.working_hours WHERE workshop_id = rec.id;
    IF existing_count = 0 THEN
      INSERT INTO public.working_hours (workshop_id, day_of_week, start_time, end_time, is_active)
      VALUES
        (rec.id, 1, '08:00', '17:00', TRUE),  -- Monday
        (rec.id, 2, '08:00', '17:00', TRUE),  -- Tuesday
        (rec.id, 3, '08:00', '17:00', TRUE),  -- Wednesday
        (rec.id, 4, '08:00', '17:00', TRUE),  -- Thursday
        (rec.id, 5, '08:00', '17:00', TRUE),  -- Friday
        (rec.id, 6, '08:00', '12:00', TRUE),  -- Saturday
        (rec.id, 7, '00:00', '00:00', FALSE); -- Sunday (closed)
    END IF;

    -- Seed default email templates if none exist for this workshop.
    SELECT COUNT(*) INTO existing_count FROM public.email_templates WHERE workshop_id = rec.id;
    IF existing_count = 0 THEN
      -- quote_ready
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'quote_ready',
        'Your quote from {{businessName}} is ready',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><div style="background:#3B82F6;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">{{businessName}}</h2></div><div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;"><p>Hi {{customerName}},</p><p>Your quote <strong>{{quoteNumber}}</strong> for <strong>{{serviceType}}</strong> is ready.</p><p><strong>Vehicle:</strong> {{vehicleInfo}}</p><p><strong>Total:</strong> <span style="font-size:18px;color:#3B82F6;font-weight:bold;">{{total}}</span></p><div style="text-align:center;margin:24px 0;"><a href="{{quoteUrl}}" style="background:#10B981;color:#fff;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">View & Approve Quote</a></div><p style="font-size:12px;color:#999;">Quote valid until {{expiryDate}}. Reply to this email or call {{businessPhone}}.</p></div></div>',
        TRUE);

      -- quote_accepted_alert (admin notification)
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'quote_accepted_alert',
        '✅ Quote accepted — {{customerName}}',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2 style="color:#10B981;">Quote Accepted</h2><p><strong>{{customerName}}</strong> has accepted quote {{quoteNumber}}.</p><p>Service: <strong>{{serviceType}}</strong><br/>Vehicle: <strong>{{vehicleInfo}}</strong><br/>Total: <strong>{{total}}</strong></p><p><a href="{{dashboardUrl}}" style="background:#3B82F6;color:#fff;padding:10px 24px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">View on Dashboard</a></p></div>',
        TRUE);

      -- quote_declined_alert (admin notification)
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'quote_declined_alert',
        '❌ Quote declined — {{customerName}}',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2 style="color:#F44336;">Quote Declined</h2><p><strong>{{customerName}}</strong> has declined quote {{quoteNumber}}.</p><p>Service: <strong>{{serviceType}}</strong><br/>Vehicle: <strong>{{vehicleInfo}}</strong></p><p><a href="{{dashboardUrl}}" style="background:#3B82F6;color:#fff;padding:10px 24px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">View on Dashboard</a></p></div>',
        TRUE);

      -- appointment_confirmation
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'appointment_confirmation',
        'Your appointment is confirmed — {{appointmentDate}}',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><div style="background:#10B981;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">Appointment Confirmed</h2></div><div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;"><p>Hi {{customerName}},</p><p>Your appointment is confirmed:</p><p><strong>Date:</strong> {{appointmentDate}}<br/><strong>Time:</strong> {{appointmentTime}}<br/><strong>Service:</strong> {{serviceType}}<br/><strong>Vehicle:</strong> {{vehicleInfo}}</p><p style="font-size:12px;color:#999;">Need to reschedule? Call {{businessPhone}}.</p></div></div>',
        TRUE);

      -- work_order_status_update
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'work_order_status_update',
        'Update on your {{vehicleInfo}} — {{statusLabel}}',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2 style="color:#3B82F6;">Status Update</h2><p>Hi {{customerName}},</p><p>Status update for your <strong>{{vehicleInfo}}</strong>:</p><div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;"><strong>{{statusLabel}}</strong></div><p>{{statusDescription}}</p><p style="font-size:12px;color:#999;">Call {{businessPhone}} for questions.</p></div>',
        TRUE);

      -- work_order_revision
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'work_order_revision',
        'Revision requested — {{vehicleInfo}}',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2 style="color:#F59E0B;">Revision Requested</h2><p>Hi {{customerName}},</p><p>A revision has been requested for your <strong>{{vehicleInfo}}</strong> work order.</p><p><strong>Additional work:</strong> {{revisionDescription}}</p><p><strong>Revised total:</strong> {{revisedTotal}}</p><p><a href="{{actionUrl}}" style="background:#3B82F6;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">Review Revision</a></p></div>',
        TRUE);

      -- invoice_sent
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'invoice_sent',
        'Your invoice from {{businessName}}',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><div style="background:#3B82F6;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">Invoice {{invoiceNumber}}</h2></div><div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;"><p>Hi {{customerName}},</p><p>Your invoice {{invoiceNumber}} is ready.</p><p><strong>Total:</strong> <span style="font-size:18px;color:#3B82F6;font-weight:bold;">{{total}}</span></p><p><a href="{{invoiceUrl}}" style="background:#10B981;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">View Invoice</a></p><p style="font-size:12px;color:#999;">Questions? Call {{businessPhone}}.</p></div></div>',
        TRUE);

      -- post_service_thank_you
      INSERT INTO public.email_templates (workshop_id, template_key, subject, html_body, is_default)
      VALUES (rec.id, 'post_service_thank_you',
        'Thanks for choosing {{businessName}}',
        '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2>Thank You, {{customerName}}!</h2><p>Thank you for trusting <strong>{{businessName}}</strong> with your {{vehicleInfo}}.</p><p>We hope you are happy with the service. If you have a moment, please leave us a review — it helps other drivers find trusted mechanics.</p><div style="text-align:center;margin:24px 0;"><a href="{{reviewUrl}}" style="background:#3B82F6;color:#fff;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">Leave a Review</a></div><p style="font-size:12px;color:#999;">Book your next service at {{businessName}}.</p></div>',
        TRUE);
    END IF;
  END LOOP;
END $$;
