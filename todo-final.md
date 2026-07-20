# Autofield-Technics — Final Todo

## ✅ COMPLETED

### P1: Fix business settings
- [x] Fix business settings forms — 6 components use `workshop_id` instead of `id='config'`
- [x] Update `business_settings` RLS policy so super_admin can modify any workshop's settings
- [x] Types + build verified

### P2: Super-admin dashboard
- [x] `/api/admin/super-admin/stats` — cross-workshop aggregates
- [x] `/dashboard/super-admin` — real dashboard with stat cards + workshops table
- [x] `/dashboard/super-admin/workshops` — enhanced with stats columns
- [x] `/dashboard/super-admin/settings?workshop_id=X` — per-workshop settings editor

### P3: Global users view
- [x] `/dashboard/super-admin/users` — search, role/workshop filters, pagination
- [x] `/api/admin/super-admin/users` — service-role paginated endpoint

### P5: Cleanup
- [x] `lib/supabase.ts` trimmed 386→98 lines (removed ~40 dead helpers)

### MD1: Database migration
- [x] Migration: 14 business fields from `profiles` → `business_settings`
- [x] Types updated, migration applied to Supabase
- [x] PDF routes + admin settings now read from `business_settings`

### MD2: Environment & routing
- [x] `NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TIMEZONE` env vars
- [x] `middleware.ts` — central route protection, workshop-slug header injection
- [x] `proxy.ts` deleted

### MD3: SITE_CONFIG purge
- [x] `getMergedSiteConfig()` — workshop-scoped via `DEFAULT_WORKSHOP_SLUG`
- [x] `SiteConfigProvider` expanded with ALL branding fields
- [x] `getBrandingCss()` in layout — workshop-scoped
- [x] 10 critical components refactored: Header, Footer, SiteLogo, QuoteForm, /quote, TestimonialsCarousel, w/[slug], sitemap, contact page, layout metadata
- [x] Reviews page, Services page — SITE_CONFIG → getMergedSiteConfig()
- [ ] Remaining ~8 low-priority files (auth pages, terms, privacy, FAQ, locations, error, not-found — SITE_CONFIG fallback works, deferred)

### MD4: PDFs & emails
- [x] Quote PDF — all business fields from `business_settings` (logo, company, banking, terms)
- [x] Invoice PDF — same
- [x] Admin settings — saves business fields to `business_settings`
- [x] Fallback cleanup — stripped all `|| profile?.field` patterns

### Phase A: Fallback cleanup
- [x] Quote PDF, Invoice PDF, Admin settings — stripped profile fallbacks

### Phase B: Timezone & Email FROM
- [x] Timezone → `NEXT_PUBLIC_TIMEZONE` env var
- [x] `EMAIL_FROM` → `business_settings.email_display_name` / `email_reply_to`
- [x] Book route was clean (no hardcoded timezone found)

### Phase C: Quote features
- [x] Migration: `deposit_percent`, `deposit_amount`, `expiry_date` on quotes table
- [x] QuoteBuilder — 3 new form inputs (deposit %, amount, expiry date)
- [x] POST/PATCH /api/admin/quotes — accepts new fields
- [x] Quote PDF — renders deposit info + expiry date
- [x] Public quote page (`/quote/[id]`) — shows deposit, expiry, banking details, terms & conditions
- [ ] Fees (`hourly_rate`, `callout_fee`, `diagnostic_fee`) into quote/invoice math (deferred)
- [ ] Run SQL: `migrations/20260719_add_quote_deposit_fields.sql`

### Phase D: Email engine
- [x] Centralized `sendEmail()` — resolves sender from `business_settings` via `workshopId`
- [x] `email_logs` table — migration + types, tracks sent/failed with template_key, workshop_id
- [x] Webhook quote route + Contact form route → centralized `sendEmail`
- [x] RLS policies on `email_logs`
- [ ] Run SQL: `migrations/20260719_create_email_logs.sql`

### Phase E: SITE_CONFIG refactors
- [x] Contact page — `getMergedSiteConfig()` (phone, email, address, hours)
- [x] Homepage ogImage → config.images.favicon
- [x] Layout metadata — removed duplicate + SITE_CONFIG
- [x] Reviews page — `getMergedSiteConfig()` (subtitle, metadata)
- [x] Services page — `getMergedSiteConfig()` (hero title, description, city)
- [x] ~14 remaining files refactored: auth pages (4), onboarding (2), FAQ, terms, privacy, locations, error, not-found

### P10: Fee math
- [x] `default_deposit_percent` auto-populates in QuoteBuilder from `business_settings`

### P12: Security
- [x] `middleware.ts` — central route protection
- [x] `admin-auth.ts` — `getUser()` server-side session verification
- [x] Edge Function — `AUTH_HOOK_SECRET` verification
- [x] Rate limiting: sign-up (3/min), forgot-password (3/5min), reset-password (3/5min)
- [x] Idle timeout modal — 30-min inactivity, 1-min countdown, keep-alive + logout buttons
- [ ] Secure cookie overrides (deferred)
- [ ] Active sessions list + "log out all devices" (deferred)
- [ ] Audit log table (deferred)
- [ ] MFA / 2FA (deferred)
- [ ] Email verification enforcement (deferred)

---

## ⏳ DEFERRED

| Item | Priority |
|---|---|
| P4: Cross-workshop analytics charts | Low |
| P7: WhatsApp auto_reply template | Low |
| P8: Wire fees into quote/invoice math | Medium |
| P10: 21 email templates (quotes, appointments, work-orders, invoices, reviews, welcome) | Medium |
| P11: Editable email templates CMS (table, CRUD, preview, UI) | Medium |
| P12: Secure cookies, session management, audit log, MFA | Low |
| Phase E: ~8 remaining SITE_CONFIG refactors | Low |

---

## 📋 SQL to run in Supabase Dashboard

```sql
-- 1. RLS policy for business_settings (already run)
DROP POLICY IF EXISTS "Business settings modify tenant isolated" ON public.business_settings;
CREATE POLICY "Business settings modify tenant isolated" ON public.business_settings
FOR ALL USING (
    (workshop_id = public.current_workshop_id()
     AND public.current_user_role() IN ('admin', 'super_admin'))
    OR public.is_super_admin()
);

-- 2. Deposit fields on quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC(5,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 3. Email logs table
-- Run: migrations/20260719_create_email_logs.sql
```
