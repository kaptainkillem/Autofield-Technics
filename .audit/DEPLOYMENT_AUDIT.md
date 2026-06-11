# 🚀 Production Deployment Checklist — Autofield Technics
**Last Audited:** June 2026 | **Auditor:** Prince Ncube | **Status:** [PASS/FAIL/REVIEW]

## 1. Pre-Deployment Configuration & Database Checks
- [ ] **Relational Constraint Verification:** Verify that any database alterations match your cascading identity definitions. All user rows inside your satellite schemas must map data paths cleanly to the parent profiles model: ALTER TABLE public.new_table ADD CONSTRAINT fk_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
- [ ] **RLS Migration Testing:** Verify that all data definitions scripts include explicit row level security activations before migration adjustments are pushed live.
- [ ] **Production Keys Validation:** Double-check that environment token blocks match your production targets, routing keys safely through your live WhatsApp endpoint accounts, Resend integrations, and remote production database configurations.

## 2. Post-Deployment Smoke Testing (Launch + 5 Minutes)
- [ ] **Dynamic Sector Loading Check:** Access your production marketplace dashboard path /services and check that your 5 custom category slots load data parameters straight from the database schema layouts.
- [ ] **Fallback Empty Grid Simulation:** Access a non-existent category route string manually to guarantee that your dynamic fallback UI cards render correctly, demonstrating clean user call-to-actions without throwing 404 errors.
- [ ] **Heading Overrides Scan:** Check detailed repair list items directly in your production browser, verifying that headers, titles, and item breakdown notes are perfectly visible with sharp colors.

## 3. Emergency Operations Rollback Plan
- [ ] **Rollback Execution Readiness:** Confirm your engineering team knows exactly how to trigger a fast reversion step if error tracking monitors observe system disruptions by force-deploying the last tagged stable branch back to the Vercel production repository.
- [ ] **Supabase Stash Restores:** Confirm that automatic data snapshots are verified daily, allowing you to trace relational parameters seamlessly if schema modifications drop keys unexpectedly.