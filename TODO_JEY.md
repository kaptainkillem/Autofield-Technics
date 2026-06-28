# Jey's 6-Week Development Plan — Autofield Technics

> **Role:** Developer B (Jey)  
> **Focus:** Leads, Quote Inbox, Booking System, Calendar, Customer Dashboard, Admin Dashboard, Notifications, Customer Management, Walk-in Customers, Homepage Polish, Settings UI, Responsive Design, Accessibility, Charts, Testing  
> **Last Updated:** June 2026

---

## Decisions & Context

| Decision | Answer |
|----------|--------|
| **Schema migrations** | **Jey applies directly** to live Supabase DB and updates `schema.sql` in repo. |
| **Quote builder** | **Vic is building it.** Jey's Leads "Accept → Create Quote" flow is blocked until Vic delivers. Jey will integrate once ready. |
| **Mechanic approval** | **Required for launch.** Customer requests slot → Mechanic approves → Booking confirmed. |
| **TypeScript build failures** | **Not blocking right now.** Will be fixed opportunistically or if they start failing. |

---

## Week 1 — Foundation & Security

> *Prerequisites for everything else. Stabilize before building features.*

- [x] **1.1** Fix middleware role check — query `profiles.role` from Supabase server-side. Stop reading `user_metadata` (client-tamperable).
- [x] **1.2** Fix deprecated Next.js 16 middleware convention (`middleware.ts` → `proxy.ts`).
- [x] **1.3** Add `working_hours` table to live DB + `schema.sql` (`day_of_week`, `start_time`, `end_time`, `is_active`).
- [x] **1.4** Add `blocked_slots` table to live DB + `schema.sql` (`mechanic_id`, `start_datetime`, `end_datetime`, `reason`).
- [x] **1.5** Guard API routes with session + admin role verification (`api/quotes/[id]`, etc.).
- [x] **1.6** Add Zod input validation to API routes (`api/auth/signin`, `api/quotes/[id]`, `api/webhooks/quote`).
- [x] **1.7** Add security headers in `next.config.ts` (CSP, X-Frame-Options, HSTS, Referrer-Policy).
- [x] **1.8** Fix `next.config.ts` — add `images.domains` for Supabase Storage, `output: 'standalone'`, redirects.
- [x] **1.9** Create `/api/health` route for Docker healthcheck.
- [x] **1.10** *(Opportunistic)* Fix TypeScript build failures if they resurface — audit `Database` types across admin/client pages.

**Bonus completed during schema sync:**
- [x] Regenerated `types/database.ts` from live Supabase DB
- [x] Updated `schema.sql` to match live DB exactly (new `quotes` columns, `seo_locations` table, standardized `gen_random_uuid()`)
- [x] Created and applied migration for missing tables: `appointments`, `leads`, `vehicles`, `users`, `analytics`
- [x] Fixed all null-handling TypeScript errors across codebase (`issued_at` → `created_at`, Date guards, type mismatches)
- [x] Build passes clean: `npx tsc --noEmit` ✅ + `npm run build` ✅

**Deliverable:** Stable, secure foundation. All admin routes properly protected. Schema ready for calendar.

---

## Week 2 — Calendar & Booking System

> *Core scheduling engine. Unblocks "Lead → Quote → Cash" workflow.*

- [x] **2.1** Build `/dashboard/admin/jobs/calendar` — Month/Week toggle, CSS-grid.
- [x] **2.2** Click empty slot → create manual appointment modal.
- [x] **2.3** Click existing → edit modal (date, time, status, notes).
- [x] **2.4** Color coding: Pending (amber), Confirmed (primary), Completed (success), Cancelled (grey).
- [x] **2.5** "Today" button + month navigation.
- [x] **2.6** Blocked slots greyed out on calendar.
- [x] **2.7** Admin Availability Settings tab — Working Hours (Mon-Sun grid).
- [x] **2.8** Admin Availability Settings tab — Blocked Slots (calendar view, click to block).
- [x] **2.9** `GET /api/availability?date=YYYY-MM-DD` — return available 1-hour slots.
- [x] **2.10** Mini "Upcoming jobs" widget on admin dashboard.
- [ ] **2.11** *(Stretch)* Drag-and-drop reschedule.

**Deliverable:** Fully functional admin calendar with availability engine.

---

## Week 3 — Customer Booking Flow & Walk-ins

> *Customer-facing booking + walk-in workflow. Mechanic approval required.*

- [x] **3.1** Customer booking calendar + time picker on dashboard.
- [x] **3.2** Only show mechanic's working hours minus blocked slots minus existing appointments.
- [x] **3.3** `POST /api/quotes/[id]/book` — customer picks slot → creates **pending approval** appointment.
- [x] **3.4** Mechanic approval step — admin sees pending booking request, approves/declines.
- [x] **3.5** Appointment confirmation UI — "Scheduled for [date] at [time]" (shown after approval).
- [x] **3.6** Customer can cancel appointment + admin sees instantly.
- [x] **3.7** Walk-in workflow: "Add New Customer" modal from admin.
- [x] **3.8** Walk-in: Create customer → Create quote → Invoice → Done (UI only, Vic owns invoice logic).
- [x] **3.9** Customer detail page — show lifetime spend, all receipts.
- [x] **3.10** Add `location` section to `SITE_CONFIG`.
- [x] **3.11** Fix suburb page hardcoded values (Google Maps iframe, CTA text, etc.).

**Deliverable:** Customers can book appointments (with approval). Admins can manage walk-ins.

---

## Week 4 — Admin Polish & Real-Time

> *Make admin feel professional and alive.*

- [ ] **4.1** Admin Dashboard charts — Monthly revenue, quote status pie, conversion funnel (`recharts`).
- [ ] **4.2** Make AdminStats tiles clickable (link to relevant pages).
- [ ] **4.3** Add loading skeletons to all dashboards (Suspense boundaries).
- [ ] **4.4** Supabase Realtime on `quotes` and `leads` tables.
- [ ] **4.5** Admin dashboard toast: "New lead from [Name]".
- [ ] **4.6** Customer dashboard toast: "Your quote is ready!".
- [ ] **4.7** Improve QuotesInbox row actions — bulk select, bulk status change.
- [ ] **4.8** Add loading states to all admin table actions (prevent double-clicks).
- [ ] **4.9** Standardize section padding — shared page wrapper utility.
- [ ] **4.10** Improve form section typography hierarchy.

**Deliverable:** Admin dashboard feels real-time and polished. Charts active.

---

## Week 5 — Settings Completion & Public Pages

> *Finish settings tabs + build missing public pages.*

- [ ] **5.1** Settings Tab: Working Hours (integration with Week 2 tables).
- [ ] **5.2** Settings Tab: Notifications.
- [ ] **5.3** Settings Tab: WhatsApp.
- [ ] **5.4** Settings Tab: Email.
- [ ] **5.5** Settings Tab: Branding.
- [ ] **5.6** Build `/contact` page — form (writes to `leads`), map embed, hours from `SITE_CONFIG`.
- [ ] **5.7** Build `/faq` page — config-driven from `SITE_CONFIG`.
- [ ] **5.8** Add `robots.txt` + dynamic `sitemap.ts`.
- [ ] **5.9** Add `generateMetadata` to all public pages (`/services`, `/quote`, `/reviews`, `/terms`, `/privacy`).
- [ ] **5.10** Homepage SEO improvements.

**Deliverable:** All settings tabs complete. Public pages built. SEO ready.

---

## Week 6 — Launch Polish

> *Responsive, accessible, error handling, bug fixes.*

- [ ] **6.1** Responsive testing — Phone, Tablet, Desktop.
- [ ] **6.2** Error pages (404, 500).
- [ ] **6.3** Forms accessibility audit (ARIA labels, focus management).
- [ ] **6.4** Dark mode toggle (`next-themes`).
- [ ] **6.5** PWA — `manifest.ts` + icons.
- [ ] **6.6** Testimonials carousel on homepage (rotate approved reviews).
- [ ] **6.7** Rate limiting on API — in-memory token bucket on auth, quote submit, review submit.
- [ ] **6.8** Sanitize `review_text` / `comment` — strip HTML, max length 2000.
- [ ] **6.9** Hardcoded admin page titles → move to `SITE_CONFIG`.
- [ ] **6.10** Universal `sonner` toast coverage audit.
- [ ] **6.11** Extract webhook email template to reusable file.
- [ ] **6.12** Final bug fixes from testing.

**Deliverable:** Launch-ready product. Responsive, accessible, secure.

---

## Post-Launch Backlog

| # | Task | Source |
|---|------|--------|
| PL.1 | PWA push notifications | Roadmap Post-Launch |
| PL.2 | Analytics improvements | Roadmap Post-Launch |
| PL.3 | Customer portal improvements | Roadmap Post-Launch |
| PL.4 | Quote → Account Nudge (anonymous quote linking) | TODO #58 |
| PL.5 | Pre-service vehicle photo upload | TODO #66 |
| PL.6 | Automated follow-up for pending quotes (24h WhatsApp) | TODO #67 |
| PL.7 | Receipt printable view | TODO #65 |
| PL.8 | Vehicle VIN decoder | Roadmap Post-Launch |

---

## Blockers / Dependencies on Vic (Developer A)

| Item | Needed By | Status |
|------|-----------|--------|
| Quote builder (`/dashboard/admin/quotes/maker` or modal) | Week 3 (Walk-in flow) | Vic building |
| Invoice engine + receipt generation | Week 3 (Walk-in flow) | Vic building |
| PDF engine (`react-pdf`) | Week 5+ (if needed for printable views) | Vic building |
| Core business settings schema stability | Week 1 (if schema conflicts) | Coordinate |

---

## Quick Links

- **Roadmap:** `Autofield_6_Week_Development_Roadmap.md`
- **Master TODO:** `TODO.md`
- **Schema:** `schema.sql`
- **Database Types:** `types/database.ts`
- **Middleware:** `middleware.ts`
- **Config:** `next.config.ts`
