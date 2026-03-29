# QA Baseline Report — The Finishing Touch CRM

**Date**: 2026-03-28
**Branch**: main (pre-wiring baseline)
**Validator**: A-Team QA Agent

---

## Build Status: PASS

`npx next build` completes successfully. All pages render (static and dynamic). 19+ routes compiled.

## TypeScript Check: PASS

`npx tsc --noEmit` returns zero errors.

---

## Demo Data Imports in Page Files: 26 files

Every CRM page still imports from `@/lib/demo-data`. Full list:

| # | File | Imports |
|---|------|---------|
| 1 | dashboard/page.tsx | demoLeads, demoActivities, demoCustomers, demoInvoices, demoAgents, demoAgentActions, demoCalendarEvents |
| 2 | leads/page.tsx | demoLeads, demoCustomers, demoTeam |
| 3 | leads/[id]/page.tsx | (multiple demo imports) |
| 4 | customers/page.tsx | demoCustomers, demoLeads, demoInvoices, demoActivities |
| 5 | customers/[id]/page.tsx | (multiple demo imports) |
| 6 | customers/new/page.tsx | demoCustomers, demoTeam |
| 7 | estimates/page.tsx | demoEstimates, demoCustomers |
| 8 | estimates/[id]/page.tsx | demoEstimates, demoCustomers |
| 9 | estimates/new/page.tsx | demoCustomers |
| 10 | invoices/page.tsx | demoInvoices, demoCustomers, demoPayments |
| 11 | invoices/[id]/page.tsx | demoInvoices, demoCustomers, demoPayments, demoEstimates |
| 12 | invoices/new/page.tsx | demoCustomers, demoEstimates |
| 13 | calendar/page.tsx | demoCalendarEvents, demoCustomers, demoTeam |
| 14 | job-walk/page.tsx | demoJobWalks, demoJobWalkPhotos, demoCustomers |
| 15 | job-walk/[id]/page.tsx | demoJobWalks, demoJobWalkPhotos, demoCustomers |
| 16 | job-walk/new/page.tsx | demoCustomers |
| 17 | vision/page.tsx | demoCustomers, demoVisionProjects |
| 18 | vision/history/page.tsx | demoVisionProjects, demoCustomers |
| 19 | agents/page.tsx | demoAgents, demoAgentActions |
| 20 | agents/[id]/page.tsx | demoAgents, demoAgentActions, demoCustomers |
| 21 | marketing/contacts/page.tsx | demoMarketingContacts |
| 22 | marketing/templates/page.tsx | demoEmailTemplates |
| 23 | marketing/campaigns/page.tsx | demoCampaigns, demoEmailTemplates, demoMarketingContacts |
| 24 | marketing/automations/page.tsx | demoAutomations |
| 25 | marketing/referrals/page.tsx | (none — already wired) |
| 26 | settings/page.tsx | demoTeam |
| 27 | (public)/pay/[id]/page.tsx | demoInvoices, demoCustomers |

**Note**: marketing/referrals/page.tsx did NOT appear in grep results — it may already be wired or not importing demo data.

---

## Demo Data Imports in API Routes: 4 files

| # | File | Imports |
|---|------|---------|
| 1 | api/invoices/route.ts | demoInvoices |
| 2 | api/invoices/[id]/send/route.ts | demoInvoices, demoCustomers |
| 3 | api/invoices/[id]/pdf/route.ts | demoInvoices, demoCustomers |
| 4 | api/pay/[id]/route.ts | demoInvoices |

---

## Missing List API Endpoints: 10

These endpoints are required by frontend pages but do not exist:

| # | Expected Path | Status |
|---|---------------|--------|
| 1 | api/customers/route.ts | MISSING |
| 2 | api/leads/route.ts | MISSING |
| 3 | api/agents/route.ts | MISSING |
| 4 | api/activities/route.ts | MISSING |
| 5 | api/payments/route.ts | MISSING |
| 6 | api/team-members/route.ts | MISSING |
| 7 | api/marketing/contacts/route.ts | MISSING |
| 8 | api/marketing/templates/route.ts | MISSING |
| 9 | api/marketing/campaigns/route.ts | MISSING |
| 10 | api/marketing/automations/route.ts | MISSING |

**Existing top-level route.ts files**: chatbot, estimates, invoices, job-walks

---

## Stub/Placeholder Patterns Found

### Fake ID generation in API routes:
- `src/app/(crm)/api/invoices/route.ts:15` — `id: \`inv-${Date.now()}\`` (POST handler creates fake IDs instead of using Supabase)
- `src/app/(crm)/api/invoices/route.ts:16` — `invoice_number: \`TFT-${String(demoInvoices.length + 1).padStart(4, "0")}\`` (fake invoice numbering)

### Demo mode fallbacks in API routes (acceptable — not stubs):
- `api/pay/[id]/route.ts` — returns `demo: true` when Stripe not configured
- `api/vision/generate/route.ts` — returns `demo_mode: true` when AI not configured
- `api/settings/data/clear-demo/route.ts` — intentional demo data clearing endpoint

### Legitimate Date.now() usage (NOT stubs):
- Job walk photo/sketch/voice uploads use `Date.now()` for unique filenames — this is correct
- Estimate/vision share routes use `Date.now()` for expiration calculation — this is correct

---

## Other Observations

1. **Types file** (`src/lib/types.ts`) appears complete with interfaces for all major entities matching the database schema listed in the briefing.
2. **Supabase client** is configured and used by existing wired routes (estimates, calendar, agents, customers/[id], job-walks).
3. **Build produces both static and dynamic routes** — static pages will need to become dynamic once they fetch data via API routes.
4. **No test runner configured** — no vitest or jest in the project. Previous QA session (S898) added vitest for vitanova-ag but this is a different project.

---

## Summary

| Check | Status |
|-------|--------|
| TypeScript compilation | PASS (0 errors) |
| Production build | PASS |
| Page files with demo imports | 26 files need wiring |
| API routes with demo imports | 4 files need wiring |
| Missing list endpoints | 10 endpoints need creation |
| Stub patterns in API | 1 route (invoices POST) |
