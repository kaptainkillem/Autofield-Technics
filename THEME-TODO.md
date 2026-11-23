# THEME-TODO — Phase 1 + Expanded Color System & Live Preview

**Scope:** Option B — theme isolation, expanded color tokens, live preview, query deduplication. Subscription tiers are a follow-up milestone.

**Goal:** Two devs work in parallel with minimal merge conflicts. Dev A owns theme architecture + DB + live preview. Dev B owns input primitives + global CSS + sitewide form sweep.

---

## Dev A — Theme Architecture, DB, Live Preview & `cache()`

### A1. Database & Types

- `migrations/<timestamp>_expand_business_settings_colors.sql`
  - Add nullable columns to `public.business_settings`:
    - `heading_color`
    - `primary_text_color`
    - `subtext_color`
    - `hero_bg_color`
    - `hero_text_color`
  - Keep existing `primary_color`, `accent_color`, `secondary_text_color`.
  - Recreate `public_business_settings` view to include the new columns.
- `schema.sql` — mirror the migration changes.
- `types/database.ts` — add new columns to `public.business_settings` type.
- `lib/get-site-config.ts` — update `MergedSiteConfig` and `getMergedSiteConfig()` with defaults for the 6 new tokens plus existing fields.

### A2. Scoped Theme Injection

- Create `components/providers/TenantThemeWrapper.tsx`
  - Accepts `config` and renders a wrapper `div` with inline CSS variables:
    - `--theme-primary`
    - `--theme-heading`
    - `--theme-text`
    - `--theme-subtext`
    - `--theme-hero-bg`
    - `--theme-hero-text`
  - Uses platform defaults if accidentally wrapped around super-admin.

### A3. Remove Global `:root` Injection

- Update `app/layout.tsx`
  - Remove `buildBrandingCss()` function.
  - Remove the `<style dangerouslySetInnerHTML>` injection.
  - Keep font link and `SiteConfigProvider`.
  - Wrap `ConditionalLayout` children in `TenantThemeWrapper` only for public pages and `/dashboard/admin/*`.

### A4. Super-Admin Lock

- Verify `app/(dashboard)/dashboard/super-admin/layout.tsx` uses `SuperAdminThemeProvider`.
- Verify `components/providers/SuperAdminThemeProvider.tsx` hardcodes platform tokens:
  - `--theme-primary: #E67E22`
  - `--theme-black: #0D0D0D`
  - `--theme-grey: #333333`
- Ensure no `--theme-*` variables leak into super-admin.

### A5. Public Component Wiring

- `components/features/Hero.tsx` — use `--theme-hero-bg`, `--theme-hero-text`, `--theme-primary`.
- Heading components — use `--theme-heading`.
- Body/subtext — use `--theme-text` / `--theme-subtext`.
- Primary buttons — use `--theme-primary`.

### A6. Live Theme Customizer Preview

- Create `components/settings/ThemeCustomizerPreview.tsx`
  - 6 color pickers + hex inputs bound to form state.
  - Mini hero block + content block + sample input.
  - "Reset to Defaults" button.
  - Low-contrast warning.
- Integrate into `components/settings/BrandingForm.tsx` and the super-admin workshop editor.

### A7. Query Deduplication

- In `lib/get-site-config.ts`, replace `unstable_noStore()` with `import { cache } from 'react'`.
- Wrap `getMergedSiteConfig()` and workshop slug/ID lookup helpers in `cache()`.
- Verify only one Supabase query per request.

**Dev A Acceptance Criteria:**

- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] Super-admin renders platform colors regardless of workshop branding.
- [ ] Public pages reflect workshop colors.
- [ ] Live preview updates before save.
- [ ] No duplicate `public_business_settings` / `workshops` queries per page load.

---

## Dev B — Input Contrast & Sitewide Sweep

### B1. Create Base Form Primitives

- `components/ui/input.tsx`
  - Classes: `bg-white text-[#0D0D0D] placeholder:text-gray-500 border-gray-300 rounded-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`.
- `components/ui/textarea.tsx`
  - Same classes + `resize-none`.
- `components/ui/select.tsx`
  - Same classes + `appearance-none` if custom chevron needed.

### B2. Global CSS Safeguard

- `app/globals.css`
  - Add to `@layer base`:
    ```css
    input, textarea, select {
      color: #0D0D0D;
    }
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    textarea:-webkit-autofill,
    select:-webkit-autofill {
      -webkit-text-fill-color: #0D0D0D !important;
      transition: background-color 5000s ease-in-out 0s;
    }
    ```
  - Update `.form-input`, `.form-textarea`, `.form-select` utilities to explicitly include `bg-white text-[#0D0D0D] placeholder:text-gray-500`.

### B3. Grep & Migrate Raw Inputs

Search `app/` and `components/` for `<input`, `<textarea`, `<select`.

Priority files:

- `components/QuoteForm.tsx`
- `components/admin/documents/QuoteBuilder.tsx` (fix `bg-transparent` line-item inputs)
- `components/features/ReviewForm.tsx`
- `components/settings/BusinessForm.tsx`
- `components/settings/BrandingForm.tsx`
- `app/(dashboard)/dashboard/super-admin/workshops/page.tsx`
- Admin modals: `AddVehicleModal.tsx`, `TransactionModal.tsx`, `AddNewCustomerModal.tsx`, `EditClientForm.tsx`, etc.

For each:

- Replace with new `Input`, `Textarea`, `Select` primitives **or** add explicit `bg-white text-[#0D0D0D] placeholder:text-gray-500`.
- Remove `text-white`, `text-foreground`, `bg-transparent`, or inherited dark-mode classes.

### B4. Super-Admin Dark Theme Input Check

- Under `data-theme="motion-grid"`, verify inputs remain light-background + black text.
- Fix any `--color-grey-deep` or inverted-color issues on form controls.

### B5. Hardcoded Color Bleed Check

- `app/globals.css` `color-mix(..., #fdfbf3)` invoice background — evaluate dark-theme bleed and patch or flag to Dev A.

**Dev B Acceptance Criteria:**

- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] Browser autofill shows black text on white background.
- [ ] No inputs have `text-white` / `text-foreground`.
- [ ] Quote intake, login, admin forms, super-admin forms all readable.

---

## Cross-Dev Coordination (to avoid merge conflicts)

1. **File ownership — no overlap:**
   - Dev A owns `app/layout.tsx`, `lib/get-site-config.ts`, `types/database.ts`, `schema.sql`, `migrations/`, `components/providers/*`, `components/features/Hero.tsx`, headings, buttons, and `ThemeCustomizerPreview.tsx`.
   - Dev B owns `app/globals.css`, `components/ui/input.tsx|textarea.tsx|select.tsx`, and all form/modal input migrations.

2. **One shared file to watch:** `components/settings/BrandingForm.tsx`
   - Dev A adds the `ThemeCustomizerPreview` component into the layout (e.g., above or below the form).
   - Dev B migrates the form's own `<input>` / `<select>` tags to the new primitives.
   - Both should touch different parts of the file. Communicate before merging.

3. **Dependency on primitives:**
   - `ThemeCustomizerPreview.tsx` includes a sample input field. Dev A can use the new `Input` primitive as soon as Dev B lands it.
   - To stay independent: Dev A can render the sample input with explicit `bg-white text-[#0D0D0D]` classes, and Dev B will migrate it later.

4. **Merge order:**
   - Dev A's branch should merge first (DB + theme architecture are foundational).
   - Dev B's branch merges second and resolves any minor conflicts in `BrandingForm.tsx`.
   - Run `npx tsc --noEmit` and `npm run build` on the merged result.

---

## Final Verification

- [ ] Both branches green on `npx tsc --noEmit`.
- [ ] Both branches green on `npm run build`.
- [ ] Super-admin stays locked to copper/black/grey regardless of workshop branding.
- [ ] Public pages reflect workshop colors.
- [ ] All inputs show black text, including autofill.
- [ ] No duplicate Supabase queries per page load.
