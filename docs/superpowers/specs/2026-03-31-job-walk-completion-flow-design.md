# Job Walk Completion Flow — Auto-Generate Estimate & Convert to Invoice

## Summary

When Evan completes a job walk, the system auto-generates an estimate from the walk data and surfaces it in-place with a one-tap "Convert to Invoice" option. Eliminates manual estimate creation and reduces the walk-to-invoice path to two taps.

## Current State

- "Complete Job Walk" button only sets client-side state — never calls `/api/job-walks/[id]/complete`
- Post-completion shows 4 links: Create Estimate (navigates away), Vision Studio, Schedule Follow-up, Share with Team
- `/api/job-walks/[id]/create-estimate` exists with full pricing logic but is never called from the UI
- `/api/estimates/[id]/convert` exists to convert estimate to invoice
- No "Create Invoice" option in post-completion UI

## Design

### Completion Flow

1. Evan taps "Complete Job Walk"
2. Button enters loading state ("Completing..." with spinner)
3. `POST /api/job-walks/[id]/complete` fires — marks walk as `completed` in DB
4. `POST /api/job-walks/[id]/create-estimate` fires immediately after — auto-generates estimate from walk data
5. On success: store returned `estimate_id` and estimate summary in component state, render post-completion panel
6. On failure: show error toast, still mark as completed, render manual "Create Estimate" fallback link

### Post-Completion Panel

Replaces the current 4-link list.

**Estimate Card** (top, always visible after completion):
- Displays: project type, total price, line item count, timeline
- Two buttons:
  - "View Estimate" — navigates to `/estimates/[estimateId]`
  - "Convert to Invoice" — calls `POST /api/estimates/[estimateId]/convert`, on success navigates to `/invoices/[newInvoiceId]`

**Secondary Actions** (below estimate card):
- Vision Studio link (unchanged)
- Schedule Follow-up link (unchanged)
- Share with Team button (unchanged)

"Create Estimate" link removed — now automatic.

### Revisiting a Completed Walk

When loading a job walk that already has `status === "completed"` or `status === "estimated"`:
- Fetch the linked estimate via the estimates API (filter by `job_walk_id`)
- Render the same post-completion panel with the existing estimate data
- If status is `estimated`, the estimate card shows; if an invoice already exists from that estimate, show "View Invoice" instead of "Convert to Invoice"

### Error Handling

- **Double-completion guard**: API already returns 400 if walk is already completed/estimated
- **Estimate generation fails**: Error toast, completion still stands, manual "Create Estimate" link shown as fallback
- **Convert to Invoice fails**: Error toast on panel, button re-enables
- **No measurements**: Estimate generates with defaults (0 sqft, 4" depth) — missing fields warning already shown pre-completion

## Files Changed

- `src/app/(crm)/job-walk/[id]/page.tsx` — completion handler, post-completion panel UI, estimate state management
- No new files, no API changes, no migration changes

## Out of Scope

- Editing estimate line items inline on the job walk page
- Auto-sending the estimate to the customer
- Invoice customization before creation
