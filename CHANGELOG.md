# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - July 2026 — Multi-Tenancy & Email System

### 🏗️ Multi-Tenant Architecture (MD1–MD4)

#### Database Migration
- **`migrations/20260719_move_business_fields_to_business_settings.sql`** — Moved 14 business fields from `profiles` → `business_settings` (company_name, logo_url, address, vat_number, registration_number, bank_name, account_holder, account_number, branch_code, terms_conditions, hourly_rate, callout_fee, diagnostic_fee, default_deposit_percent)
- **`business_settings` RLS** — Added `OR public.is_super_admin()` so super-admins can edit any workshop's settings
- **`types/database.ts`** — Added `workshop_id` to all 16 tenant tables; added `workshops`, `email_logs`, `email_templates` tables; added deposit fields to quotes

#### Environment & Routing
- **`middleware.ts`** — Created with full route protection + workshop-slug injection via `NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG` env var; `proxy.ts` deleted
- **New env vars** — `NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TIMEZONE`
- **Multi-deployment ready** — Each Vercel deployment connects to same Supabase, shows per-workshop branding via `business_settings`

#### SITE_CONFIG Purge (25+ files)
- **`getMergedSiteConfig()`** — Now workshop-scoped via `DEFAULT_WORKSHOP_SLUG`; expanded interface with ALL branding fields
- **`SiteConfigProvider`** — Expanded context with companyName, address, logoUrl, primaryColor, accentColor, faviconUrl, documentFooter, termsConditions, socialMedia, nav, quotes, services, reviews
- **Layout branding CSS** — `getBrandingCss()` now workshop-scoped
- **Component refactors** — Header, Footer, SiteLogo, QuoteForm, /quote, TestimonialsCarousel, contact page, reviews page, services page, auth pages (4), onboarding (2), FAQ, terms, privacy, locations, error, not-found — all now use `useSiteConfig()` (client) or `getMergedSiteConfig()` (server)

#### PDF & Email Branding
- **Quote PDF** — Reads all business fields from `business_settings` (logo, company, address, banking, terms, footer)
- **Invoice PDF** — Same
- **Admin settings** — Saves business fields to `business_settings`; split save into profiles (personal) + business_settings (workshop)

### 🔐 Security Hardening (P12)

- **`admin-auth.ts`** — Added `getUser()` server-side session verification (catches revoked/deleted users)
- **`supabase/functions/custom-access-token/index.ts`** — `AUTH_HOOK_SECRET` verification via `Authorization: Bearer` header
- **Rate limiting** — New API routes for sign-up (3/min), forgot-password (3/5min), reset-password (3/5min); wired into auth pages
- **Idle timeout** — `SessionTimeoutProvider` with 30-min inactivity, 1-min countdown warning modal, keep-alive + logout buttons; mounted on all dashboard pages
- **Cookie security** — `Secure`, `HttpOnly`, `SameSite: Lax` enforced on auth cookies in `lib/supabaseServer.ts` + `middleware.ts` in production

### 🏢 Super-Admin Dashboard (P2, P3)

- **`/api/admin/super-admin/stats`** — Cross-workshop aggregates (workshops, customers, quotes, revenue, appointments)
- **`/dashboard/super-admin`** — Real dashboard with stat cards + workshops overview table
- **`/dashboard/super-admin/workshops`** — Enhanced with stats columns (customers, quotes, revenue, jobs)
- **`/dashboard/super-admin/settings?workshop_id=X`** — Per-workshop settings editor reusing admin form components
- **`/dashboard/super-admin/users`** — Global users view with search, role/workshop filters, pagination
- **`/api/admin/super-admin/users`** — Service-role paginated endpoint

### 📧 Email Template System (P10, P11)

- **Centralized `sendEmail()`** — Resolves sender from `business_settings.email_display_name` / `email_reply_to` via `workshopId`; logs to `email_logs`
- **`email_logs` table** — Tracks sent/failed emails with template_key, workshop_id, metadata; RLS policies
- **`email_templates` table** — Per-workshop template overrides; RLS policies; CMS-ready
- **8 core templates** — quote_ready (Customer), quote_accepted_alert (Admin), quote_declined_alert (Admin), appointment_confirmation (Customer), work_order_status_update (Customer), work_order_revision (Customer), invoice_sent (Customer), post_service_thank_you (Customer)
- **6 triggers wired** — Customer-action route, work-order status/revision, appointments, invoices, quote PDF
- **Admin recipient** — Workshop-scoped via `getWorkshopAdminEmail()` → `business_settings.contact_email`
- **Email CMS** — `/dashboard/admin/settings` → Templates tab; template list, editor, variable helpers, live preview, save/reset; available on super-admin too
- **Category file split** — `lib/email-templates/` with 7 files (types, helpers, quotes, appointments, work-orders, invoices, account, index)

### 📐 Quote Engine Improvements (Phase C)

- **Deposit fields** — `deposit_percent`, `deposit_amount`, `expiry_date` on quotes table; form inputs in QuoteBuilder; shown on PDF + public quote page
- **Fee checkboxes** — `callout_fee` + `diagnostic_fee` from `business_settings` auto-populate as line items when checked
- **`default_deposit_percent`** — Auto-populates in QuoteBuilder from `business_settings`
- **Public quote page** — Shows banking details + terms & conditions from `business_settings`

### 🧹 Code Quality

- **`lib/supabase.ts`** — Trimmed from 386 to 98 lines; removed ~40 unused helpers (services, reviews, receipts, analytics, views, quotes)
- **Fallback cleanup** — Stripped `|| profile?.field` patterns from PDF routes + admin settings after migration applied
- **Email templates refactor** — Split 360-line monolithic file into 7 category files under `lib/email-templates/`
- **Settings forms** — 6 settings components updated from `id='config'` to `workshop_id` PK

### 🐛 Fixes

- **Timezone** — Hardcoded `"Africa/Johannesburg"` → `NEXT_PUBLIC_TIMEZONE` env var
- **Email FROM** — Hardcoded `"Autofield Technics"` → `business_settings.email_display_name` / `email_reply_to`
- **WhatsApp** — Hardcoded `*Autofield Technics*` → `business_settings.whatsapp_auto_reply`
- **`w/[slug]` footer** — Hardcoded "Powered by Autofield Technics" removed
- **TestimonialsCarousel** — Hardcoded "Johannesburg" → `config.city`
- **`/quote` default workshop** — `.limit(1).single()` → `DEFAULT_WORKSHOP_SLUG` env var

---

## [1.1.0] - July 2026 — Security Audit & Production Hardening

#### 🔴 Critical API Auth Fixes
- **`quote/[id]/book/route.ts`** — Added full `getUser()` auth with cryptographic token validation; booking implies acceptance (auto-sets status to `accepted`); unauthenticated → 401
- **`quote/[id]/customer-action/route.ts`** — Replaced unsafe manual `atob()` JWT decode with `getUser()` crypto validation; added quote_token-based claiming for unowned quotes
- **`quote/[id]/route.ts`** — `verifyAdmin()` now calls both `getSession()` + `getUser()` (matches `verifyStaffUser()` pattern)
- **`lib/supabase.ts`** — Removed `const _supabase = supabase as any` wrapper; all helpers now fully typed with `TablesInsert<>` generics

#### 🔐 Quote Token Auth Flow (NEW)
- **`schema.sql`** — Added `quote_token UUID DEFAULT gen_random_uuid() UNIQUE` to quotes table
- **`QuoteClaimPrompt.tsx`** — Upsell component for unauthenticated quote viewers (feature list + sign-in/sign-up with redirect)
- **`quote/[id]/page.tsx`** — Server-side auth gate; reads `?token=` from URL; conditionally renders upsell vs action buttons
- **`QuoteActionButtons.tsx`** — Accept `quoteToken` prop; passes token in accept/decline API calls
- **`CustomerBookingForm.tsx`** — Accept `quoteToken` prop; passes token in booking API calls
- **`QuoteForm.tsx`** — Stores `quote_token` in localStorage on submit for post-signup mapping
- **`lib/email-templates/index.ts`** — Quote links now include `?token={quoteToken}` parameter
- **`lib/email.ts`** + **`pdf/route.ts`** — `quoteToken` propagated through email send pipeline

#### 🗄️ Schema Sync
- **`schema.sql`** — Added `workshop_id` to 11 missing tables (services, appointments, receipts, expenses, analytics, work_orders, work_order_events, working_hours, blocked_slots, faqs, categories)
- **`schema.sql`** — Fixed `business_settings` PK from `id TEXT` to `workshop_id UUID`
- **`schema.sql`** — Fixed `services.user_id` FK from deleted `public.users` → `public.profiles(id)`
- **`schema.sql`** — Fixed `handle_new_user()` to read `role` from `raw_user_meta_data` (reverted hardcoded `'client'`)
- **`types/database.ts`** — Regenerated from live Supabase DB (22 tables, email_templates, email_logs, views)
- **`types/database.ts`** — Removed stale `public.users` type (confirmed deleted from live DB)
- **`types/database.ts`** — Added `quote_token` to Quotes Row/Insert/Update

#### 🧹 Code Quality
- Fixed 2 relative imports → `@/` absolute aliases (`lib/site-config.ts`, `services/[id]/page.tsx`)
- `QuoteForm.tsx` now maps PG error codes (42501, 23502) to user-friendly messages
- `app/reviews/page.tsx` typed with `Database['public']['Tables']['reviews']['Row']` (no more `any`)
- `lib/rate-limiter.ts` documented x-forwarded-for trust assumption (Vercel-only)

### Verified (No Changes Needed)
- **RLS** — All 22 tables confirmed with Row Level Security + workshop_id tenant isolation
- **`SUPABASE_SERVICE_ROLE_KEY`** — Only in 3 server-side files; never exposed to client
- **`NEXT_PUBLIC_`** — No secret keys prefixed; all public vars are intentional
- **Zod validation** — 30 API routes use Zod schemas; zero mass assignment risks
- **Graceful degradation** — `business_settings` failures fall back to `SITE_CONFIG` defaults + hardcoded CSS
- **Mobile overflow** — 21 components use `overflow-x-auto` on tables
- **Loading states** — 100+ async buttons with `disabled={loading}` + `Loader2` spinners

---

## [1.0.0] - June 2026

### Added
- **MobileStickyCTA** — Floating conversion bar for mobile + desktop with scroll-based visibility and footer intersection hiding
- **EmptyState** — Reusable fallback UI component for empty data and error states
- **ServicesHero** — Page hero with configurable CTA button (supports `ctaText` + `ctaHref` props)
- **Terms of Service page** — `/terms` with legal placeholder content
- **Privacy Policy page** — `/privacy` with POPIA-compliant placeholder content
- **Breadcrumb** — Navigation breadcrumb component
- **DynamicIcon** — Icon lookup component with named imports (lucide-react tree-shaking)
- **Auth error sanitization** — `lib/auth-utils.ts` with `sanitizeAuthError()` and `sanitizeFormError()`
- **Logout functionality** — Header detects auth state and shows Login/Logout button with `supabase.auth.signOut()`
- **Admin check function** — `public.is_admin()` in `schema.sql` with `SECURITY DEFINER`
- **RLS policies** — For `services`, `categories`, `quotes`, `reviews`, `receipts` tables
- **`text-grey-dark` and `text-grey-lightest`** — Added to Tailwind config and CSS variables
- **`export const dynamic = 'force-dynamic'`** — Added to all database-query pages
- **Proper `types/database.ts`** — Full TypeScript definitions for all 9 Supabase tables + views + functions
- **`@layer base` for heading colors** — Moved heading color defaults from `variables.css` to `@layer base` in `globals.css` to prevent Tailwind utility override issues

### Changed
- **Service pages** — Replaced hardcoded values with `SITE_CONFIG` (phone, city, region, country)
- **Hero.tsx** — CTA buttons now wrap in `<Link>` when `href` is provided (previously dead buttons)
- **Header.tsx** — Internal nav links now use `<Link>` instead of `<a>` (SPA navigation). Phone number pulled from `SITE_CONFIG`
- **Footer.tsx** — Internal links now use `<Link>`. Added Legal section (Terms & Privacy). Phone number from `SITE_CONFIG`
- **MobileStickyCTA styling** — Changed to `bg-grey-lightest` with primary-tinted shadow (matching sidebar)
- **`@theme` block in `globals.css`** — Fixed circular `var()` references by using direct hex values
- **Variables.css headings** — Removed `color` declarations from `h1`-`h4` element selectors to prevent overriding Tailwind utilities
- **Services archive page** — Added `MobileStickyCTA` and `pb-32` padding
- **Category page** — Replaced `StickyServiceSidebar` with `MobileStickyCTA`
- **Service detail page** — Added hero CTA + `MobileStickyCTA`. Desktop sidebar hidden on mobile.
- **Auth pages** — All error messages now use `sanitizeAuthError()` / `sanitizeFormError()` instead of raw `error.message`
- **handle_new_user trigger** — Now reads `role` from `raw_user_meta_data` instead of hardcoding `'client'`

### Removed
- **StickyServiceSidebar.tsx** — Replaced by `MobileStickyCTA`
- **lib/data/categories.ts** — Dead mock data file (all data now from Supabase)
- **StatsCard.tsx** — Empty component (0 bytes)
- **QuoteForm.tsx** — Empty component (0 bytes)
- **ReviewCard.tsx** — Empty component (0 bytes)
- **AdminNav.tsx** — Empty component (0 bytes)
- **`dangerouslySetInnerHTML` style block** — In service detail page (replaced with proper Tailwind classes)
- **Hardcoded hex values** — In `variables.css` gradients and focus ring (replaced with CSS variables)

### Fixed
- **Build errors** — `types/database.ts` was corrupted; rebuilt with proper TypeScript definitions
- **Type errors** — `categoryInfo` and `matchedCategory` resolved as `never` due to missing types in `database.ts`
- **Hero CTA buttons** — Were dead (had `href` but no `onClick` or `<Link>` wrapping)
- **Broken links** — `/terms` and `/privacy` returned 404 (pages now exist)
- **Error message leaks** — Raw Supabase error messages with schema names were rendered directly to UI
- **Tree-shaking** — `DynamicIcon` imported full `lucide-react` bundle (`* as Icons`). Fixed with named imports + static map.
- **Heading visibility** — `text-primary` was being overridden by `variables.css` heading color declarations. Fixed with `@layer base`.
- **Contrast issues** — `text-white` on `bg-grey-light` in hero sections (still needs review)
- **Token metadata sync** — `handle_new_user()` now respects `role` from `raw_user_meta_data`

### Security
- Added `public.is_admin()` function with `SECURITY DEFINER`
- Added RLS policies for all public tables
- Added error sanitization to prevent schema leaks
- Added logout functionality with session cleanup
- Added `SITE_CONFIG` as single source of truth for business data (phone, city, etc.)

### Audit Results
- **Code Quality:** 7/8 PASS (1 FAIL → fixed: dead files deleted)
- **Design:** 6/8 PASS (2 FAIL: quote form missing, hero contrast)
- **Performance:** 6/7 PASS (1 FAIL: tree-shaking → fixed)
- **Security:** 4/13 PASS (9 FAILs → fixed: is_admin, RLS, logout, error sanitization, metadata sync)
- **Deployment:** 5/8 PASS (3 FAILs → fixed: empty grid fallback, heading visibility)

---

## [0.9.0] - Pre-June 2026

### Initial Setup
- Project scaffolding & Docker setup
- Design Tokens & Brand Identity
- Floating Header & Reusable Button
- Hero Section Widget (with/without image)
- Supabase integration
- NextAuth.js setup
- Basic middleware for /admin paths
- Tailwind v4 CSS variable theme
- Custom @utility classes (btn-primary, card, heading-1, etc.)
