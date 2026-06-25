# Autofield Technics — Launch Sprint TODO

## High Priority (Complete)

- [x] 1. **Extract shared form-input utility class**
- [x] 2. **Add focus rings for keyboard accessibility**
- [x] 3. **Fix color contrast issues**
- [x] 4. **Fix logout — missing server-side cookie clearing**
- [x] 5. **Add error handling to logout**
- [x] 6. **Create client dashboard at `/dashboard`**
- [x] 7. **Move admin dashboard from `/dashboard` to `/dashboard/admin`**
- [x] 8. **Block admins from `/dashboard` and clients from `/dashboard/admin`**
- [x] 9. **Fix onboarding redirect — role-aware**
- [x] 10. **Fix signin hardcoded redirect**
- [x] 11. **Replace emoji icons in AdminStats with Lucide icons**
- [x] 12. **Fix AdminNav dead-code active state**
- [x] 13. **Consolidate dual dashboard routes**
- [x] 14. **Fetch approved reviews from Supabase** — ScrollingReviews.tsx fetches and displays approved reviews
- [x] 15. **Replace Unicode stars with Lucide Star icons**
- [x] 16. **Make QuoteForm vehicle grid responsive**
- [x] 17. **Extract shared StatusBadge component**
- [x] 18. **Add loading state to logout button**
- [x] 19. **Personalize account icon with user's first name initial**
- [x] 20. **Header dashboard link should be role-aware**
- [x] 22. **Generate deterministic avatar colors from reviewer name**
- [x] 23. **Standardize success states**
- [x] 24. **Remove hover:shadow-md from base card utility**
- [x] 28. **Remove unused `supabaseHelpers.auth.signOut`**
- [x] 29. **`setUser(null)` is redundant in `handleLogout`**
- [x] 31. **Create `/dashboard/admin/jobs` page** — Already exists
- [x] 33. **Fix hardcoded placeholder emails in webhook**
- [x] 34. **Run `npm install` to fix @next/swc lockfile**
- [x] 44. **Jobs / Work Orders Page** — Already exists
- [x] 45. **Service Management CRUD** — Already exists
- [x] 46. **Toast Notification System** — `sonner` already installed

## 🔴 CRITICAL — Security & Stability

- [ ] 21. **Secure role check in middleware** — Query `profiles.role` from Supabase server-side. Stop reading from `user_metadata` (client-tamperable). Use RLS-protected profiles query or custom JWT claims.
- [ ] 30. **Fix TypeScript build failures** — Supabase `.update()`/`.insert()` calls fail type-check in `onboarding/vehicle`, `dashboard/admin`, `dashboard`, `QuoteForm`. Fix `Database` types or add safe assertions.
- [ ] 32. **Fix schema mismatch** — Verify `vehicle_make`+`vehicle_model` match everywhere (`schema.sql` vs `database.ts` vs app code). `receipts` table schema must match types. **NOTE: reviews table schema mismatch (comment vs review_text) was fixed — other tables may still mismatch.**
- [ ] 35. **Fix deprecated middleware convention** — Next.js 16 warns: "middleware file convention is deprecated. Use proxy instead." **NOTE: `middleware.ts` still exists, needs rename to `proxy.ts`**
- [ ] 36. **Add Zod input validation to API routes** — `api/auth/signin`, `api/quotes/[id]`, `api/webhooks/quote`. Catches malformed payloads before Supabase.
- [ ] 61. **Rate Limiting on API** — In-memory token bucket or `lru-cache` on auth endpoints, quote submit, review submit. Prevents brute-force/spam. No paid services needed.
- [ ] 62. **Guard API routes with session + admin role verification** — `api/quotes/[id]` uses admin client but never verifies caller is admin. Add session check + `profiles.role = 'admin'` query.
- [ ] 64. **Add security headers in `next.config.ts`** — CSP, X-Frame-Options, HSTS, Referrer-Policy.
- [ ] 65. **Create `/api/health` route** — Docker healthcheck references it but file doesn't exist.
- [ ] 66. **Fix `next.config.ts`** — Add `images.domains` for Supabase Storage, security headers, redirects, `output: 'standalone'`.
- [ ] 67. **Add `robots.txt` + dynamic `sitemap.ts`** — Generate from `seo_registry` + services.
- [ ] 68. **Add `generateMetadata` to all public pages** — `/services`, `/quote`, `/reviews`, `/terms`, `/privacy`.

## 🟠 HIGH — Friction Removal

- [ ] 25. **Standardize section padding** — Create shared page wrapper utility.
- [ ] 37. **Fix hardcoded admin page titles** — Move to `SITE_CONFIG`.
- [ ] 38. **Add loading skeletons to dashboards** — Suspense boundaries for all server components with DB queries.
- [ ] 39. **Extract webhook email template** — Move inline HTML from `api/webhooks/quote` to reusable template file.
- [ ] 40. **Fix suburb page hardcoded values** — Google Maps iframe (static Sandton coords), CTA text, country name, reviews subtitle. Use `SITE_CONFIG` + `replaceVars()`.
- [ ] 41. **Add `location` section to SITE_CONFIG** — Centralize page-specific marketing strings so copy can be tweaked without touching TSX.
- [ ] 42. **Restore full triptych descriptions** — Current versions are truncated vs previous rich descriptions.
- [ ] 43. **Universal `sonner` toast coverage** — Missing from vehicle add, settings save, admin actions. Audit all async mutations.
- [ ] 47. **Harden quote form validation** — SA mobile phone regex (`/^\+?27\d{9}$/`). Trim inputs. Enforce year bounds.
- [ ] 48. **Sanitize `review_text`** — Strip HTML/script tags before insert. Add max length (2000 chars). **NOTE: column renamed to `comment` — sanitization still needed.**
- [ ] 49. **Add loading states to all admin table actions** — QuotesInbox, JobsTable, ServicesTable. Prevent double-clicks.
- [ ] 50. **Improve QuotesInbox row actions** — Bulk select, bulk status change.
- [ ] 51. **Improve form section typography hierarchy** — Standardize headings, labels, helper text across all forms.

## 🟡 FEATURES — Core Launch

### Homepage Build (COMPLETED)

The homepage (`app/page.tsx`) was rebuilt with the following widget components:

- [x] **Hero** — Centered text on mobile, CTAs stacked vertically, 2-col grid with image on desktop
- [x] **ScrollingReviews** — Fetches approved reviews from Supabase, horizontal scroll with snap on mobile + desktop, uses existing `ReviewCard` component
- [x] **FeatureShowcase** — 3 alternating image/text feature sections with responsive layout
- [x] **HowItWorks** — 3-step process grid, horizontal scroll with snap on mobile, grid on desktop
- [x] **ServicesGrid** — Fetches categories from Supabase, horizontal scroll with snap on mobile, grid on desktop
- [x] **BottomCTA** — Dark section with centered text and CTA button, flush against footer (no margin gap)
- [x] **Tailwind animate-marquee** — Added `animate-marquee` keyframe + animation class for ScrollingReviews
- [x] **Fix nested main tag** — `app/page.tsx` had `<main>` inside `ConditionalLayout`'s `<main className="flex-1">`. Replaced inner `<main>` with `<>` fragment to fix flex layout.
- [x] **ReviewForm auth gating** — ReviewForm requires authentication. Shows "sign in" link + disables submit for anonymous users. Includes `user_id` in insert payload.
- [x] **Reviews approval page** — Created `/dashboard/admin/reviews` with approve/reject/delete actions, filter tabs by status

### 52. Lead → Quote → Cash Workflow

**Architecture:** `leads` = raw inquiries (no price, no date). `quotes` = priced proposals with line items. Customer never sees price until admin sends quote. Customer picks date+time only AFTER accepting quoted price.

**Admin Side:**
- [ ] 52a. **Leads Inbox** (`/dashboard/admin/leads`) — Accept or Decline actions only
- [ ] 52b. `POST /api/admin/leads/[id]/accept` — Moves lead to quotes table as `status: pending`
- [ ] 52c. `POST /api/admin/leads/[id]/decline` — Marks declined, notifies customer
- [ ] 52d. **Quote Builder Modal** — Admin adds line items with "+": description, qty, unit price. Auto-calculates subtotal → tax → total. Live running total. Delete row. Auto-save draft.
- [ ] 52e. **Send Quote Modal** — Admin reviews, adds notes, clicks Send. Status becomes `quoted`. Generates PDF. Emails customer with attachment.
- [ ] 52f. `POST /api/admin/quotes/[id]/send` — Saves line items, updates status, triggers email
- [ ] 52g. `POST /api/admin/quotes/[id]/complete` — Mark job done → generate receipt
- [ ] 52h. **Quotes Inbox Update** — Show statuses: Draft / Quoted / Accepted / Scheduled / Completed

**Customer Side:**
- [ ] 52i. **Quote Card on Dashboard** — Line-item breakdown: description, qty, unit price, line total. Subtotal, Tax, Total. Buttons: "Accept Quote" / "Decline Quote"
- [ ] 52j. `POST /api/quotes/[id]/accept` — Customer accepts → unlocks booking
- [ ] 52k. **Booking Calendar + Time Picker** — Date picker + 1-hour slots. Only shows mechanic's working hours minus blocked slots minus existing appointments.
- [ ] 52l. `POST /api/quotes/[id]/book` — Customer picks slot → creates appointment
- [ ] 52m. **Appointment Confirmation** — Shows "Scheduled for [date] at [time]"

### 53. Interactive Admin Calendar

- [ ] 53a. Build `/dashboard/admin/jobs/calendar` — Month/Week toggle, CSS-grid
- [ ] 53b. Click empty slot → create manual appointment modal
- [ ] 53c. Click existing → edit modal (date, time, status, notes)
- [ ] 53d. Drag-and-drop reschedule
- [ ] 53e. Color coding: Pending (amber), Confirmed (primary), Completed (success), Cancelled (grey)
- [ ] 53f. Blocked slots greyed out
- [ ] 53g. "Today" button + month nav
- [ ] 53h. Mini "Upcoming jobs" widget on admin dashboard

### 54. Mechanic Availability System

- [ ] 54a. **`working_hours` table** — `day_of_week` (0-6), `start_time`, `end_time`, `is_active`
- [ ] 54b. **`blocked_slots` table** — `mechanic_id`, `start_datetime`, `end_datetime`, `reason`
- [ ] 54c. **Admin Availability Settings** — Working Hours tab (Mon-Sun grid) + Blocked Slots tab (calendar view, click to block)
- [ ] 54d. `GET /api/availability?date=YYYY-MM-DD` — Returns available 1-hour slots by checking working hours → subtracting appointments → subtracting blocked slots

### 55. Admin Settings (3-Tab Command Center)

- [ ] 55a. **Tab 1: Business Identity** — Company name, tagline, logo upload (Supabase Storage, compressed), phone, email, address, VAT #, company registration, live PDF preview
- [ ] 55b. **Tab 2: Financials** — Bank name, account holder, account number, branch code, default tax rate (15%), call-out fee, diagnostic fee, payment terms, deposit policy toggle + percentage
- [ ] 55c. **Tab 3: Quote Settings** — Standard T&Cs, default deposit toggle, service areas list

### 56. PDF Generation

- [ ] 56a. Install `react-pdf` / `@react-pdf/renderer`
- [ ] 56b. **Quote PDF** — Logo + business details, customer info, vehicle details, line-item table, subtotal/tax/total, deposit, banking details, T&Cs footer
- [ ] 56c. **Receipt PDF** — Marked "PAID", payment method + date
- [ ] 56d. `POST /api/quotes/[id]/pdf` + `POST /api/receipts/[id]/pdf` — Generate on-demand
- [ ] 56e. Store in Supabase Storage, return public URL

### 57. Email Notifications (Resend)

- [ ] 57a. "New lead received" → admin
- [ ] 57b. "Your quote is ready" → customer (with PDF)
- [ ] 57c. "Quote accepted" → admin
- [ ] 57d. "Your appointment is confirmed" → customer
- [ ] 57e. "Quote declined" → customer
- [ ] 57f. "Job completed — your receipt" → customer (with PDF)

### 58. Quote → Account Nudge

- [ ] 58a. Redesign quote success screen — "Create account to track this quote" CTA
- [ ] 58b. Signup/signin reads `pending_quote_id` from localStorage
- [ ] 58c. After auth + onboarding → auto-link quote to new `user_id`
- [ ] 58d. Dashboard shows claimed quote immediately
- [ ] 58e. Signin page banner when `pending_quote_id` exists

### 59. Real-Time Notifications

- [ ] 59a. Supabase Realtime on `quotes` and `leads` tables
- [ ] 59b. Admin dashboard toast: "New lead from [Name]"
- [ ] 59c. Customer dashboard toast: "Your quote is ready!"

### 60. Standalone Pages

- [ ] 60a. `/contact` — Form (writes to `leads`), map embed, hours from `SITE_CONFIG`
- [ ] 60b. `/faq` — Config-driven from `SITE_CONFIG`
- [ ] 60c. `/dashboard/admin/customers/[id]` — Customer detail: all quotes, vehicles, reviews, receipts, lifetime spend

### 61. PWA

- [ ] 61a. `manifest.ts` + icons
- [ ] 61b. Installable on mobile

## 🟢 POLISH

- [ ] 62. **Dark mode toggle** — `next-themes`
- [ ] 63. **Analytics charts on admin dashboard** — `recharts` already installed. Monthly revenue, quote status pie chart, conversion funnel
- [ ] 64. **Testimonials carousel on homepage** — Rotate approved reviews **NOTE: ScrollingReviews implemented with horizontal scroll — carousel not yet built**
- [ ] 65. **Receipt printable view** — Clean print-friendly layout with business branding
- [ ] 66. **Pre-service vehicle photo upload** — 2-3 photos in quote process, checkboxes for pre-existing damage
- [ ] 67. **Automated follow-up for pending quotes** — If not accepted in 24h, show "Send Follow-up" button pre-filling WhatsApp message
- [ ] 68. **Vehicle VIN decoder** (deferred post-launch) — Auto-populate year/make/model from VIN

---

## Database Schema Notes (IMPORTANT)

### ⚠️ schema.sql LAGS BEHIND LIVE DB

The `schema.sql` file does NOT fully reflect the live Supabase database. Always verify column names against the actual database when writing queries.

### Reviews Table (VERIFIED)

| Column | Old expectation | Actual (live DB) |
|--------|----------------|------------------|
| `review_text` | NOT NULL | **Use `comment` instead** |
| `vehicle_serviced` | nullable | **Column does not exist** |
| `customer_email` | missing | **Exists, nullable** |

When modifying review-related code:
- Read: `review.comment` (NOT `review.review_text`)
- Write: `comment` field in insert
- Omit: `vehicle_serviced` entirely
- Required: `user_id` must be included in inserts (NOT NULL constraint on live DB)

### profiles table — schema.sql MISSING MANY COLUMNS

`types/database.ts` defines ~20+ columns for `profiles` that do NOT exist in `schema.sql`:
`company_name`, `logo_url`, `address`, `vat_number`, `registration_number`, `bank_name`, `account_holder`, `account_number`, `branch_code`, `hourly_rate`, `callout_fee`, `diagnostic_fee`, `terms_conditions`, `default_deposit_percent`, `alternate_phone`, `physical_address`, `prefers_whatsapp`, `service_reminders_opt_in`, `client_status`, `internal_notes`

When modifying profile-related code, verify the column exists in the actual database first.

### vehicles table — schema.sql MISSING COLUMNS

`license_plate` and `mileage` exist in `types/database.ts` but NOT in `schema.sql`.

### ⚠️ No `is_admin()` function exists

`schema.sql` does NOT contain an `is_admin()` function. Role checking is done via `user.user_metadata.role` in the middleware.

**Last Updated:** June 2026
