# Changelog

All notable changes to this project will be documented in this file.

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
