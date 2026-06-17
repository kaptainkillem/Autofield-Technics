# Visual & Stylistic Recommendations

## High Priority

- [x] 1. **Extract shared form-input utility class** — Created `form-input`, `form-input-error`, `form-input-success`, `form-select`, `form-textarea` utilities in `globals.css`. Replaced 10+ inline class strings across QuoteForm, ReviewForm, QuotesInbox.

- [x] 2. **Add focus rings for keyboard accessibility** — All form utilities include `focus-visible:ring-2 focus-visible:ring-primary/30`. Error variants include `focus-visible:ring-error/30`.

- [x] 3. **Fix color contrast issues** — Changed `--color-grey-medium` from `#B3B3B3` (2.4:1) to `#767676` (4.54:1) in both `globals.css` and `variables.css`. Passes WCAG AA.

- [x] 4. **Fix logout — missing server-side cookie clearing** — Created `/api/auth/signout` route using `@supabase/ssr`'s `createServerClient` to expire cookies. `handleLogout` now calls this endpoint first.

- [x] 5. **Add error handling to logout** — Both `fetch('/api/auth/signout')` and `supabase.auth.signOut()` are wrapped in try/catch. Logout always proceeds to redirect.

- [x] 6. **Create client dashboard at `/dashboard`** — New `app/dashboard/page.tsx` shows personalized welcome, quick action cards, recent quotes with status badges, recent reviews. Uses user-scoped Supabase queries with RLS.

- [x] 7. **Move admin dashboard from `/dashboard` to `/dashboard/admin`** — Moved admin panel to `app/dashboard/admin/page.tsx`. Deleted `/app/admin/`. Updated `AdminNav` links.

- [x] 8. **Block admins from `/dashboard` and clients from `/dashboard/admin`** — Rewrote `middleware.ts` with full role-based routing: admins → `/dashboard/admin`, clients → `/dashboard`, misrouted users are redirected.

- [x] 9. **Fix onboarding redirect — role-aware** — `onboarding/vehicle/page.tsx` now reads `user_metadata.role` after onboarding and redirects admin → `/dashboard/admin`, client → `/dashboard`.

- [x] 10. **Fix signin hardcoded redirect** — No code change needed; `window.location.href = '/dashboard'` now works correctly because middleware intercepts and role-redirects.

## Medium Priority

- [x] 11. **Replace emoji icons in AdminStats with Lucide icons** — Replaced with `ClipboardList`, `Hourglass`, `CheckCircle2`, `Banknote`, `Star` from lucide-react.

- [x] 12. **Fix AdminNav dead-code active state** — Fixed ternary with `isActive` check. Updated all links to `/dashboard/admin`. Made brand name a link.

- [x] 13. **Consolidate dual dashboard routes** — Deleted `/app/admin/`. Admin dashboard at `/dashboard/admin`, client dashboard at `/dashboard`.

- [x] 14. **Fetch approved reviews from Supabase** — `/reviews/page.tsx` converted to async server component. Fetches `status=approved` reviews from Supabase, ordered by `created_at`. Falls back to empty-state message.

- [x] 15. **Replace Unicode stars with Lucide Star icons** — `ReviewCard` and `ReviewForm` now use `<Star>` from lucide-react. Interactive stars use `size={32}` with focus-visible ring.

- [x] 16. **Make QuoteForm vehicle grid responsive** — Changed from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`.

- [x] 17. **Extract shared StatusBadge component** — Created `components/ui/StatusBadge.tsx`. Replaced inline status badge markup in QuotesInbox, both UserQuotes components.

- [x] 18. **Add loading state to logout button** — Added `loggingOut` state. Buttons show spinner + "Logging out..." and are disabled during request.

- [x] 19. **Personalize account icon with user's first name initial** — Added `getUserInitial()`. Both mobile and desktop avatars show name initial instead of `<User>` icon.

- [x] 20. **Header dashboard link should be role-aware** — `dashboardHref` computed from `user.user_metadata.role`: admin → `/dashboard/admin`, client → `/dashboard`.

- [ ] 21. **Secure role check — move from `user_metadata` to server-verified source** — PENDING: Requires Supabase database changes (custom JWT claims or RLS-protected profiles query in middleware). Not a code-only change.

## Low Priority

- [x] 22. **Generate deterministic avatar colors from reviewer name** — `ReviewCard` now uses a hash-based color palette (`AVATAR_COLORS`). Each reviewer gets a unique avatar color.

- [x] 23. **Standardize success states** — Replaced emoji with Lucide icons (`MessageCircle`, `CheckCircle2`). Both use `h-10 w-10` and `bg-green-50 border border-green-200`.

- [x] 24. **Remove hover:shadow-md from base card utility** — Removed `hover:shadow-md` from `card` utility in `globals.css`.

- [ ] 25. **Standardize section padding** — PENDING
- [ ] 26. **Improve QuotesInbox row actions** — PENDING
- [ ] 27. **Improve form section typography hierarchy** — PENDING
- [x] 28. **Remove unused `supabaseHelpers.auth.signOut`** — Removed from `lib/supabase.ts`. Zero call sites across the codebase; all logout flows use `supabase.auth.signOut()` directly or `/api/auth/signout`.
- [x] 29. **`setUser(null)` is redundant in `handleLogout`** — Removed.

## Critical Fixes (Must Fix Before Deploy)

- [ ] 30. **Fix TypeScript build failures** — Supabase `.update()`/`.insert()` calls fail type-check in `onboarding/vehicle/page.tsx`, `dashboard/admin/page.tsx`, `dashboard/page.tsx`, `components/QuoteForm.tsx`. Fix `Database` types or add type assertions.
- [ ] 31. **Create missing `/dashboard/admin/jobs` page** — Admin dashboard links to `/dashboard/admin/jobs` but the route does not exist (404 crash).
- [ ] 32. **Fix schema mismatch** — `schema.sql` has `vehicle_make_model` (single field) but app uses `vehicle_make` + `vehicle_model` separately. Also `receipts` table schema doesn't match `database.ts` types.
- [x] 33. **Fix hardcoded placeholder emails in webhook** — Already resolved: `EMAIL_FROM` uses `process.env.EMAIL_FROM` with fallback to Resend onboarding address; `ADMIN_EMAIL` uses `process.env.ADMIN_NOTIFICATION_EMAIL` with fallback to `SITE_CONFIG.contact.email`.
- [x] 34. **Run `npm install` to fix @next/swc lockfile** — `npm install` completed successfully. Lockfile verified. No SWC-related warnings.

### New Issues from Suburb Page Audit

- [ ] **Fix hardcoded Google Maps iframe src** — Line 157 uses static Sandton coordinates instead of dynamic `{mapEmbedUrl}`. Every suburb page shows the same map.
- [ ] **Replace hardcoded CTA text with SITE_CONFIG.cta.primary** — `"Calculate Repair Estimate"` should use `SITE_CONFIG.cta.primary`.
- [ ] **Replace hardcoded country name in map query** — `"South Africa"` should use `SITE_CONFIG.address.countryFull`.
- [ ] **Replace hardcoded reviews subtitle with SITE_CONFIG.reviews.subtitle** — Should use `replaceVars(SITE_CONFIG.reviews.subtitle, ...)` instead of inline JSX template.
- [ ] **Restore full triptych descriptions** — Current versions are truncated vs. the previous rich descriptions. Need to restore the full marketing copy.
- [ ] **Add `location` section to SITE_CONFIG** — Centralize all page-specific marketing strings (H1 fallback, badge label, hero paragraph, step labels, authority heading, trust points, map labels, form heading) so copy can be tweaked without touching TSX.

## Medium Fixes

- [ ] 35. **Fix deprecated middleware convention** — Next.js 16 warns: "middleware file convention is deprecated. Use proxy instead." May break in future versions.
- [ ] 36. **Add Zod input validation to API routes** — `api/quotes/[id]`, `api/auth/*` have no payload validation. Add Zod schemas.
- [ ] 37. **Hardcoded admin page titles** — `admin/quotes/page.tsx`, `admin/customers/page.tsx`, `admin/finance/page.tsx` still have hardcoded titles. Move to `SITE_CONFIG`.
- [ ] 38. **Add loading skeletons to dashboards** — Server components with `dynamic = 'force-dynamic'` need Suspense boundaries or skeleton loaders.
- [ ] 39. **Extract webhook email template** — Inline HTML email in `api/webhooks/quote/route.ts` should be a reusable template.
- [ ] 40. **Standardize section padding** — PENDING (carry-over from Low Priority).
- [ ] 41. **Improve QuotesInbox row actions** — PENDING (carry-over from Low Priority).
- [ ] 42. **Improve form section typography hierarchy** — PENDING (carry-over from Low Priority).
- [ ] 43. **Remove unused `supabaseHelpers.auth.signOut`** — PENDING (carry-over from Low Priority).

## Features to Add

### Phase 1: Complete the Missing Pieces

- [ ] 44. **Jobs / Work Orders Page** — Create `/dashboard/admin/jobs` to manage active repairs, assign mechanics, track status pipeline.
- [ ] 45. **Service Management CRUD** — Admin can add/edit/delete services from dashboard instead of editing DB directly.
- [ ] 46. **Toast Notification System** — Install `sonner` or build custom. Add to all success/error states (auth, quotes, reviews, etc.).

### Phase 2: High Business Value

- [ ] 47. **Search & Filter on Dashboard** — Add search, filter, and sort to quotes, customers, and reviews tables.
- [ ] 48. **Customer Detail Page** — Click a customer to see full history: quotes, reviews, vehicles, receipts.
- [ ] 49. **Real-time Quote Updates** — Use Supabase Realtime so admin sees new quotes instantly without refresh.
- [ ] 50. **Invoice PDF Generation** — Generate PDFs from receipts using `react-pdf` or `@react-pdf/renderer`.
- [ ] 51. **Notifications / Alert System** — Notify admin when new quote arrives, notify customer when status changes.
- [ ] 52. **FAQ Page** — Configurable via `site-config.ts`. Reduces support calls.
- [ ] 53. **Contact Page** — Dedicated page with contact form, map embed, business hours from config.

### Phase 3: Growth & Polish

- [ ] 54. **Calendar / Booking System** — Customers book time slots. Admins see calendar view.
- [ ] 55. **SMS Notifications** — Send SMS on quote status changes via Twilio or MessageBird.
- [ ] 56. **Image Uploads** — Vehicle photos, profile pics, service gallery. Use Supabase Storage.
- [ ] 57. **Analytics Charts** — Monthly revenue trends, quote conversion rates, popular services. Recharts already installed.
- [ ] 58. **Testimonials Carousel** — Auto-rotating reviews on homepage.
- [ ] 59. **Dark Mode Toggle** — Use `next-themes` or custom context.
- [ ] 60. **PWA (Offline Support)** — Next.js has built-in PWA support.
- [ ] 61. **Rate Limiting on API** — Protect against spam on quote form and auth endpoints.
- [ ] 62. **Secure role check — server-verified** — Move from `user_metadata` to RLS-protected profiles query or custom JWT claims in middleware. PENDING (carry-over from Medium Priority).
- [ ] 63. **Fetch approved reviews from Supabase** — DEFERRED: Requires approved review data in DB. Will implement when data is available. (carry-over from Medium Priority).