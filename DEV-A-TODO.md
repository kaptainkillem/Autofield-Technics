# DEV-A-TODO — Theme Architecture, DB, Live Preview & `cache()`

**Branch:** `feature/theme-architecture-dev-a`

**Owner:** Dev A

**Goal:** Move workshop branding to scoped `--theme-*` CSS variables, lock super-admin to platform tokens, expand the color token set, add a live customizer preview, and deduplicate site-config queries with React `cache()`.

---

## Checklist

### A1. Database & Types — DONE
- [x] Create `migrations/20261122_expand_theme_colors.sql`
  - Add `heading_color`, `subtext_color`, `hero_bg_color`, `hero_text_color` to `public.business_settings`
  - Recreate `public.public_business_settings` view with new columns
- [x] Mirror migration in `schema.sql`
- [x] Update `types/database.ts` — new columns added to `business_settings` Row/Insert/Update
- [ ] (Optional / deferred) Add `public_business_settings` view type to `types/database.ts`
  - Skipped to keep the existing `as any` cast in `get-site-config.ts`; no runtime impact
- [x] Update `lib/get-site-config.ts`
  - Add `headingColor`, `textColor`, `subtextColor`, `heroBgColor`, `heroTextColor` to `MergedSiteConfig`
  - Add defaults in `getMergedSiteConfig()` return

### A2. Scoped Theme Injection — DONE
- [x] Create `components/providers/TenantThemeWrapper.tsx`
  - Applies `--theme-*` variables on a scoped wrapper
  - Skips `/dashboard/super-admin/*`
  - Keeps legacy `--brand-*` aliases for backward compatibility

### A3. Remove Global `:root` Injection — DONE
- [x] Update `app/layout.tsx`
  - Removed `buildBrandingCss()`
  - Removed `<style dangerouslySetInnerHTML>`
  - Wrapped `ConditionalLayout` in `TenantThemeWrapper`
  - Font stack now applied inline via `--brand-font-sans`

### A4. Super-Admin Lock — DONE
- [x] Harden `components/providers/SuperAdminThemeProvider.tsx`
  - Explicitly sets `--theme-*` to platform tokens (#E67E22 / #0D0D0D / #333333)
  - Resets variables on unmount

### A5. Global CSS Mapping — DONE
- [x] Update `app/globals.css`
  - `--color-primary` prefers `--theme-primary`
  - Headings/subtext mapped to `--theme-heading` / `--theme-subtext`
- [x] Update `styles/variables.css`
  - Added `--theme-*` defaults
  - Disabled the `prefers-color-scheme: dark` override that forced white headings on a light site

### A6. Public Component Wiring — DONE
- [x] Update `components/features/Hero.tsx`
  - Uses `--theme-hero-bg` and `--theme-hero-text`
- [x] Update `@layer base` headings in `app/globals.css`
  - Use `--theme-heading` / `--theme-subtext`

### A7. Live Theme Customizer Preview — DONE
- [x] Create `components/settings/ThemeCustomizerPreview.tsx`
  - 6 color pickers + hex inputs
  - Mini hero block + content block + sample input
  - Reset to Defaults button
  - Low-contrast warning (hero + body text)
- [x] Integrate into `components/settings/BrandingForm.tsx`
- [x] Update `app/(dashboard)/dashboard/super-admin/settings/page.tsx` to pass new fields

### A8. Query Deduplication — DONE
- [x] Replaced `unstable_noStore()` with `React.cache()`
- [x] Wrapped `getMergedSiteConfig()` and `resolveWorkshopId()` in `cache()`
- [x] Verified build + typecheck pass

### A9. Verification
- [x] `npx tsc --noEmit` passes (exit 0)
- [x] `npm run build` passes
- [ ] Visual: super-admin stays on platform tokens regardless of workshop branding (needs manual check)
- [ ] Visual: public pages reflect workshop colors (needs manual check)
- [ ] Visual: live preview updates before save (needs manual check)
- [ ] Network: no duplicate `public_business_settings` / `workshops` queries per page load (needs manual check)
- [ ] Apply `migrations/20261122_expand_theme_colors.sql` to live Supabase (manual)

---

## Notes
- Dev B owns `components/ui/input.tsx|textarea.tsx|select.tsx`, `app/globals.css` form rules, and the sitewide form sweep.
- `components/settings/BrandingForm.tsx` is a shared file: Dev A added `ThemeCustomizerPreview`; Dev B should migrate its raw inputs.
- Device migration SQL is applied to live Supabase manually.
- `ThemeCustomizerPreview` uses raw inputs with explicit `bg-white text-[#0D0D0D] placeholder:text-gray-500` so it does not depend on Dev B's primitives.
