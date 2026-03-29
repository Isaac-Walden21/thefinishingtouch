# Estimates Spec (`/estimates`)

## Purpose
Quote management hub. Every potential job gets an estimate before it becomes revenue. Must make it fast to create, easy to send, and simple to track which quotes are converting and which are dying on the vine.

## Email Configuration
All estimates sent via email use: `evan@thefinishingtouchllc.com` (Gmail account). This applies to all outbound email from the CRM — estimates, invoices, marketing, and agent communications.

## Capabilities

### 1. Estimate Stats Bar
Row of 4 metric cards at top:
- **Estimates This Month** — count of estimates created in current month
- **Acceptance Rate** — (accepted / sent) as percentage, with trend vs last month
- **Total Quoted Value** — sum of all active (non-declined, non-expired) estimates
- **Avg Estimate Size** — mean total across all estimates this month

### 2. Estimate Table
Columns:
- **Customer** — name, clickable to estimate detail
- **Project Type** — service category
- **Status** — badge: Draft, Sent, Accepted, Declined, Expired
- **Amount** — formatted currency
- **Date Created** — formatted date
- **Expires** — "Expires in X days" or "Expired" badge
- **Actions** — quick action buttons (see below)

### 3. Search & Filters
- **Search** — by customer name or project type
- **Status filter** — dropdown: All, Draft, Sent, Accepted, Declined, Expired
- **Project type filter** — dropdown of unique project types
- **Date range** — This Month, Last 30 Days, Last 90 Days, Custom

### 4. Quick Status Change
- Inline status dropdown on each row
- Draft → Sent (triggers email send)
- Sent → Accepted / Declined
- Status change logged as activity on the associated lead/customer

### 5. Send Estimate
- "Send" button on each row (visible for Draft and Sent statuses)
- Generates PDF of the estimate
- Sends email from `evan@thefinishingtouchllc.com` to customer email with:
  - Subject: "Your Estimate from The Finishing Touch — [Project Type]"
  - Body: professional email template with estimate summary
  - Attachment: full estimate PDF
- Status auto-changes to "Sent" on successful send
- If customer has no email: shows warning, offers to copy a shareable link instead

### 6. Convert to Invoice
- "Convert to Invoice" button on Accepted estimates
- Creates a new invoice pre-filled with:
  - Customer info
  - All line items from the estimate
  - Subtotal, margin, total carried over
  - Reference to original estimate ID
- Navigates to `/invoices/[new-id]` for review before sending

### 7. Duplicate / Clone Estimate
- "Duplicate" button on each row
- Creates a copy with:
  - Same line items, dimensions, materials, options
  - Status reset to Draft
  - New created_at timestamp
  - Customer can be changed (useful for: "same job, different customer")
- Opens the new estimate in edit mode

### 8. Expiration Tracking
- Default expiration: 30 days from creation (configurable in settings)
- Table shows expiration status:
  - "Expires in 12 days" — normal text
  - "Expires in 3 days" — amber warning
  - "Expired" — red badge
- Expired estimates with status "Sent" auto-change to "Declined" via background job or on-load check
- Expiration date editable on estimate detail page

### 9. Estimate Comparison
- Select two estimates for the same customer via checkboxes
- "Compare" button appears in bulk action bar
- Opens side-by-side comparison view:
  - Line items diff
  - Total price comparison
  - Materials and options differences
- Use case: customer wants "Option A: broom finish" vs "Option B: stamped" — send both, compare

### 10. Batch PDF Download
- Select multiple estimates via checkboxes
- "Download PDFs" button in bulk action bar
- If 1 selected: downloads single PDF
- If 2+ selected: downloads ZIP file containing individual PDFs
- File naming: `TFT-Estimate-[CustomerName]-[Date].pdf`

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | After a site visit | Creates estimate with measurements and materials, reviews line items, hits Send — customer gets a professional PDF in their inbox |
| Evan | Customer says yes | Opens the accepted estimate, clicks "Convert to Invoice", reviews the pre-filled invoice, sends it |
| Jake | Similar job for new customer | Finds a past estimate for a similar patio, clicks Duplicate, changes the customer and adjusts dimensions |
| Evan | End of month review | Checks acceptance rate — 40% this month vs 55% last month, realizes prices might be too high or follow-ups are lagging |
| Evan | Customer wants options | Creates two estimates for same customer — stamped vs broom finish — selects both, hits Compare, screenshots it and texts to customer |
| Evan | Cleaning up old quotes | Sees 5 estimates marked "Expired", confirms they're dead deals, marks associated leads as Lost |

## Data Sources
- Estimates: Supabase `estimates` table
- Customers: Join with `customers` table
- PDF generation: jsPDF or server-side PDF render
- Email send: Gmail API via `evan@thefinishingtouchllc.com` (or Resend with custom domain)
- Activities: Log send/status-change events to `activities` table

## Open Questions
- Should expiration period be per-estimate or a global setting?
- Should the comparison view be shareable with the customer via a link?
- Should there be estimate templates for common job types (standard patio, standard driveway) to speed up creation?
