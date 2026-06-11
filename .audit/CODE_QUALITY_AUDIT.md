# 📐 Code Quality & Standards Audit — Autofield Technics
**Last Audited:** June 2026 | **Auditor:** Prince Ncube | **Status:** [PASS/FAIL/REVIEW]

## 1. Project Architecture Cleanup
- [ ] **Static Resource Elimination:** Verify that the legacy mock data file @/lib/data/categories.ts has been permanently deleted from your project directories.
- [ ] **Dynamic Sourcing Execution:** Confirm that app/services/page.tsx references the live database categories table array instead of static fallback data imports.
- [ ] **Absolute Alias Consolidation:** Confirm all component files handle relative file referencing purely through structural absolute alias pointers starting with @/*. No nested relative syntax jumps (../../) are allowed.

## 2. Next.js App Router Optimization
- [ ] **Server Actions / RSC Split:** Verify that data loading tasks for your main pages run on the server side using asynchronous React Server Components (RSC) to completely eliminate heavy data-fetching hydration footprints in the client browser.
- [ ] **Forced Cache Invalidations:** Confirm that your database pages explicitly define dynamic route execution by placing this exact declaration at the top of the script blocks: export const dynamic = 'force-dynamic'
- [ ] **Dead Code Isolation:** Run automated checks to identify and wipe out unused imports, leftover template files, or non-functional dependencies out of your build paths.

## 3. Strict Type Coverage Matrix
- [ ] **Automated Typings Matrix Generation:** Ensure local TypeScript declarations are completely synced with the actual state of your remote schema layout by running: npx supabase gen types typescript --local > types/database.ts
- [ ] **Explicit Database Model Binding:** Confirm that data items fetched through your code assign their row values precisely to type models generated straight from your database definitions file: type ServicesRow = Database['public']['Tables']['services']['Row']
- [ ] **Strict Flag Affirmation:** Ensure your configuration file tsconfig.json maintains "strict": true flag parameters to block implicit any fallbacks.