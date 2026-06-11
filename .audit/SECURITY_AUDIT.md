# 🛡️ Security Audit Checklist — Autofield Technics
**Last Audited:** June 2026 | **Auditor:** Prince Ncube | **Status:** [PASS/FAIL/REVIEW]

## 1. Authentication & Authorization
- [ ] **NEXT_PUBLIC_ Restraints:** Verify that the `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side and never prefixed with `NEXT_PUBLIC_` or exposed in git version control.
- [ ] **Edge Middleware Guard:** Confirm `middleware.ts` intercepts all requests to `/admin/*` paths and strictly verifies that the user metadata contains the `"role": "admin"` claim.
- [ ] **Token Metadata Mirroring:** Verify that user claims inside `auth.users` (`raw_user_meta_data -> role`) perfectly match the data values inside `public.profiles.role` for your admin user `9e3a0dec-2795-417d-928a-d51c24b280f3`.
- [ ] **Session Destruction:** Test that clicking 'Logout' fully terminates the Supabase auth token session, invalidates cookies, and drops the client back to the public homepage securely.

## 2. Row Level Security (RLS) & Database Authorization
- [ ] **Global Table Activation:** Verify that RLS is explicitly turned on across all database tables by running: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
- [ ] **Categories Policy Protection:** Confirm public.categories is locked to public read-only (FOR SELECT USING true) and requires the public.is_admin() function for INSERT, UPDATE, or DELETE.
- [ ] **Services Activity Filter:** Confirm public.services only returns listings where is_active = true for public viewers.
- [ ] **Data Isolation Barriers:** Ensure quotes, reviews, vehicles, and receipts use strict tenant segregation matching against auth.uid() = user_id to block cross-account ID tampering.
- [ ] **Admin Security Definer Bypass:** Verify that the public.is_admin() custom Postgres function utilizes SECURITY DEFINER constraints to safely execute lookup operations without hitting infinite loops.

## 3. Input Validation & Form Sanitation
- [ ] **SQL Injection Prevention:** Confirm all database workflows utilize parameterized methods through the Supabase JavaScript library. No raw text concatenation is used to feed input strings directly to SQL fields.
- [ ] **Booking Form Limits:** Validate that quote structures parse telephone inputs safely, restrict car manufacture years to realistic numeric bounds, and clear escape characters before handling inputs.
- [ ] **Review Validation Enforcements:** Restrict rating inputs strictly to values between 1 and 5. Verify that comment fields strip out HTML tags or script injection sequences before passing content to the review moderation log.
- [ ] **Graceful Exception Leaks:** Verify that public error states catch exceptions cleanly. Database schema names, table layouts, or raw query text must never be printed to the user interface browser context.