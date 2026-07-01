# Jey's 6-Week Development Plan — Autofield Technics

> **Role:** Developer B (Jey)  
> **Focus:** Leads, Quote Inbox, Booking System, Calendar, Customer Dashboard, Admin Dashboard, Notifications, Customer Management, Walk-in Customers, Homepage Polish, Settings UI, Responsive Design, Accessibility, Charts, Testing  
> **Last Updated:** June 29, 2026

---

## Decisions & Context

| Decision | Answer |
|----------|--------|
| **Schema migrations** | **Jey applies directly** to live Supabase DB and updates `schema.sql` in repo. |
| **Quote builder** | **Vic is building it.** Jey's Leads "Accept → Create Quote" flow is blocked until Vic delivers. Jey will integrate once ready. |
| **Mechanic approval** | **Required for launch.** Customer requests slot → Mechanic approves → Booking confirmed. |
| **TypeScript build failures** | **Fixed and passing.** `npx tsc --noEmit` ✅ enforced before commits. |
| **Hybrid Config approach** | **Top 6 volatile fields moved to DB** (name, phone, city, hero text, email). Structural data stays in code. |

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
- [x] **1.10** Fix TypeScript build failures — audit `Database` types across admin/client pages.

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

- [x] **4.1** Admin Dashboard charts — Monthly revenue, quote status pie, conversion funnel (`recharts`). *(Partial — Finance Command Center + Analytics Dashboard built with charts)*
- [x] **4.2** Make AdminStats tiles clickable (link to relevant pages).
- [x] **4.3** Add loading skeletons to all dashboards (Suspense boundaries). *(Partial — added where needed)*
- [ ] **4.4** Supabase Realtime on `quotes` and `leads` tables.
- [ ] **4.5** Admin dashboard toast: "New lead from [Name]".
- [ ] **4.6** Customer dashboard toast: "Your quote is ready!".
- [x] **4.7** Improve QuotesInbox row actions — bulk select, bulk status change.
- [x] **4.8** Add loading states to all admin table actions (prevent double-clicks).
- [x] **4.9** Standardize section padding — shared page wrapper utility. *(Done — `PageWrapper` component created)*
- [x] **4.10** Improve form section typography hierarchy.

**Deliverable:** Admin dashboard feels real-time and polished. Charts active.

**Bonus completed during this week:**
- [x] **Finance Command Center** — Expenses table, transaction modal, net profit cards, revenue vs expenses chart
- [x] **Analytics Dashboard** — Job trends, revenue breakdown, service distribution charts
- [x] **FAQ Admin Page** — Full CRUD for FAQ entries in admin dashboard
- [x] **Orphaned Component Cleanup** — Removed unused imports and dead code
- [x] **Client Settings Portal** — 4-tab settings (Profile, Garage, Notifications, Security)

---

## Week 5 — Settings Completion & Public Pages

> *Finish settings tabs + build missing public pages.*

- [x] **5.1** Settings Tab: Working Hours (integration with Week 2 tables). *(Done in Week 2)*
- [x] **5.2** Settings Tab: Notifications. *(Done — in Client Settings Portal + admin settings)*
- [ ] **5.3** Settings Tab: WhatsApp.
- [ ] **5.4** Settings Tab: Email.
- [x] **5.5** Settings Tab: Branding. *(Partial — "Content" tab for website copy: name, phone, city, hero text, email)*
- [ ] **5.6** Build `/contact` page — form (writes to `leads`), map embed, hours from `SITE_CONFIG`.
- [x] **5.7** Build `/faq` page — config-driven from `SITE_CONFIG`. *(Partial — admin CRUD done; public page uses `SITE_CONFIG.faq`)*
- [ ] **5.8** Add `robots.txt` + dynamic `sitemap.ts`.
- [x] **5.9** Add `generateMetadata` to all public pages (`/services`, `/quote`, `/reviews`, `/terms`, `/privacy`). *(Partial — homepage has dynamic metadata from DB; others need audit)*
- [x] **5.10** Homepage SEO improvements. *(Done — dynamic metadata from `getMergedSiteConfig()`)*

**Deliverable:** All settings tabs complete. Public pages built. SEO ready.

**Bonus completed during this week:**
- [x] **Top 6 Hybrid Config System** — Moved volatile business data from hardcoded `site-config.ts` to `business_settings` DB table:
  - `lib/get-site-config.ts` — server-side merge utility (DB overrides code defaults)
  - `components/providers/SiteConfigProvider.tsx` — React context + `useSiteConfig()` hook
  - `components/settings/WebsiteCopyForm.tsx` — admin form with Zod validation
  - `schema.sql` — added `site_name`, `phone`, `city`, `hero_title`, `hero_description`, `contact_email`
  - `app/layout.tsx` — fetches merged config server-side, wraps app in provider, dynamic `generateMetadata()`
  - `app/page.tsx` — uses merged config for hero title/description + SEO metadata
  - `app/(dashboard)/dashboard/admin/settings/page.tsx` — added "Content" tab with `WebsiteCopyForm`
  - `types/database.ts` — patched with new columns (pending live DB deploy)

---

## Week 6 — Launch Polish

> *Responsive, accessible, error handling, bug fixes.*

- [x] **6.1** Responsive testing — Phone, Tablet, Desktop. *(Partial — ongoing; header mobile drawer done, hero padding fixed)*
- [ ] **6.2** Error pages (404, 500).
- [ ] **6.3** Forms accessibility audit (ARIA labels, focus management).
- [ ] **6.4** Dark mode toggle (`next-themes`).
- [ ] **6.5** PWA — `manifest.ts` + icons.
- [ ] **6.6** Testimonials carousel on homepage (rotate approved reviews).
- [ ] **6.7** Rate limiting on API — in-memory token bucket on auth, quote submit, review submit.
- [ ] **6.8** Sanitize `review_text` / `comment` — strip HTML, max length 2000.
- [x] **6.9** Hardcoded admin page titles → move to `SITE_CONFIG`. *(Partial — Top 6 fields moved to DB; structural data still in code)*
- [ ] **6.10** Universal `sonner` toast coverage audit.
- [ ] **6.11** Extract webhook email template to reusable file.
- [ ] **6.12** Final bug fixes from testing.

**Deliverable:** Launch-ready product. Responsive, accessible, secure.

**Homepage polish completed:**
- [x] Desktop nav buttons — white outline (`border border-white/40`) for distinction
- [x] Hero top padding increased (`pt-28 md:pt-32`) — no longer touching header

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
- **Site Config:** `lib/site-config.ts`
- **Merged Config:** `lib/get-site-config.ts`

---

## What's Missing / Still To Do

### Critical (Before Launch)

| # | Task | Week | Why |
|---|------|------|-----|
| M.1 | **Deploy schema to live Supabase** — `ALTER TABLE business_settings ADD COLUMN ...` | 5 | Hybrid config won't work without DB columns |
| M.2 | **Test end-to-end hybrid config** — Edit in admin → refresh homepage → verify changes | 5 | Ensure DB read/write works in production |
| M.3 | **Build `/contact` public page** | 5 | Missing public page; form should write to `leads` |
| M.4 | **Add `robots.txt` + `sitemap.ts`** | 5 | SEO requirement |
| M.5 | **Error pages (404, 500)** | 6 | UX requirement |
| M.6 | **Rate limiting on API** | 6 | Security requirement |

### Important (Should Have)

| # | Task | Week | Why |
|---|------|------|-----|
| I.1 | **Settings Tab: WhatsApp** | 5 | Admin needs to configure WhatsApp Business API |
| I.2 | **Settings Tab: Email** | 5 | SMTP config for transactional emails |
| I.3 | **Supabase Realtime** on quotes/leads | 4 | Live dashboard feel |
| I.4 | **Toast notifications** (new lead, quote ready) | 4 | User feedback |
| I.5 | **Testimonials carousel** on homepage | 6 | Social proof |
| I.6 | **Sanitize review_text / comment** | 6 | Security (XSS prevention) |
| I.7 | **Universal sonner toast audit** | 6 | Consistent UX |

### Nice to Have (Could Have)

| # | Task | Week | Why |
|---|------|------|-----|
| N.1 | Dark mode toggle (`next-themes`) | 6 | UX polish |
| N.2 | PWA — `manifest.ts` + icons | 6 | Mobile experience |
| N.3 | Drag-and-drop reschedule (calendar) | 2 | Power user feature |
| N.4 | Accessibility audit (ARIA, focus) | 6 | Compliance |
| N.5 | Extract webhook email template | 6 | Code cleanliness |

---

## Session Summary (June 29, 2026)

**Built today:**
1. ✅ Top 6 Hybrid Config — moved volatile business data from code to DB
2. ✅ `getMergedSiteConfig()` — server-side DB fallback utility
3. ✅ `SiteConfigProvider` + `useSiteConfig()` — React context for client components
4. ✅ `WebsiteCopyForm` — admin settings form with Zod validation
5. ✅ Dynamic homepage metadata — SEO title/description from DB
6. ✅ Desktop nav button outlines — white border for visual distinction
7. ✅ Hero top padding — increased breathing room below header
8. ✅ Patched `types/database.ts` — added 6 new columns to `business_settings`
9. ✅ TypeScript compiles clean — `npx tsc --noEmit` ✅

**Still needs deployment:**
- Run the SQL `ALTER TABLE` on live Supabase to add the 6 columns
- Test admin Content tab → save → refresh homepage
