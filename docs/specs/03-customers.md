# Customers Spec (`/customers`)

## Purpose
The master customer database. Every person who has ever contacted, been quoted, or paid The Finishing Touch lives here. Must support quick lookups, direct contact, segmentation for marketing, and a clear picture of each customer's value and engagement level.

## Capabilities

### 1. Customer Table
Columns displayed:
- **Customer** — name (clickable link to detail), source badge below
- **Contact** — phone (click-to-call `tel:` link), email (clickable `mailto:` link)
- **Location** — city, state
- **Service** — primary service type
- **Tags** — tag chips (VIP, repeat, commercial, residential, custom tags)
- **Status** — latest lead status badge
- **Leads** — count of associated leads
- **Lifetime Value** — total revenue from completed invoices for this customer
- **Last Contact** — date of most recent activity, with color coding:
  - Green: contacted within 7 days
  - Amber: 8-30 days since contact
  - Red: 30+ days since contact (going cold)

### 2. Column Sorting
- Click any column header to sort ascending
- Click again to sort descending
- Active sort shown with arrow indicator
- Default sort: most recently created first

### 3. Search & Filters
- **Search** — by name, email, phone, city, or notes content
- **Service type** — dropdown multi-select
- **Source** — dropdown multi-select
- **Tags** — dropdown multi-select
- **Last contact** — preset: Last 7 days, Last 30 days, 30+ days ago (cold)
- **Lifetime value range** — min/max dollar inputs
- Active filters show as dismissible chips
- Result count updates live: "Showing 12 of 47 customers"

### 4. Quick Contact Actions
- Phone number rendered as `tel:` link — tap to call on any device
- Email rendered as `mailto:` link — tap to open mail client
- Text button next to phone — opens `sms:` link
- All contacts logged as activities automatically when triggered from CRM (stretch goal)

### 5. Tags & Segmentation
- Each customer can have multiple tags
- Preset tags: VIP, Repeat Customer, Commercial, Residential, Do Not Contact
- Custom tags: user can create any tag (free-text entry)
- Tag management: add/remove tags inline from table or detail page
- Bulk tag: select multiple customers, apply or remove tags

### 6. Inline Editing
- Double-click (desktop) or tap edit icon (mobile) on a field to edit in place
- Editable fields: name, phone, email, city, state, zip, service type, source, notes
- Save on blur or Enter key
- Cancel on Escape key
- Shows brief save confirmation

### 7. Export to CSV
- "Export" button in page header
- Exports currently filtered/visible customers (not all if filters active)
- Columns: Name, Email, Phone, Address, City, State, ZIP, Service Type, Source, Tags, Lifetime Value, Last Contact Date
- Downloads as `tft-customers-YYYY-MM-DD.csv`

### 8. Merge Duplicates
- Select two customer rows via checkboxes
- "Merge" button appears in bulk action bar
- Merge modal shows side-by-side comparison:
  - For each field, pick which value to keep (or manually edit)
  - All leads, invoices, estimates, activities from both records consolidate under the surviving record
  - The duplicate record is soft-deleted
- Confirmation step: "This will merge Customer B into Customer A. This cannot be undone."

### 9. Customer Notes Preview
- Hover over a row (desktop) to show notes tooltip
- Mobile: tap expand chevron to reveal notes inline
- Notes truncated to 2 lines with "Show more" if longer

### 10. Pagination
- Default 25 rows per page
- Page size options: 25, 50, 100
- Previous/Next page buttons
- "Showing 1-25 of 142 customers" indicator
- Maintains filters and sort across page changes

### 11. Mobile Card View
- Below `lg` breakpoint, table switches to card layout
- Each card: name, phone (tap to call), location, status badge, lifetime value
- Tap card to navigate to customer detail

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Spring marketing push | Filters by service type "Concrete Patio" + tag "past-customer", exports CSV for a direct mail campaign |
| Jake | Duplicate cleanup | Notices "John Smith" appears twice (one from Vapi, one manual), selects both, merges records |
| Evan | VIP identification | Sorts by lifetime value descending, tags the top 10 as VIP for priority scheduling and holiday gifts |
| Evan | Cold customer outreach | Filters "Last Contact: 30+ days ago", sees 15 customers going cold, assigns Jake to call them this week |
| Jake | Quick phone update | Customer texts new number, Jake double-clicks the phone field in the table, updates it in 2 seconds |
| Evan | QuickBooks sync | Exports all customers to CSV, imports into accounting software for invoice reconciliation |

## Data Sources
- Customers: Supabase `customers` table
- Lifetime value: Aggregate from `invoices` where status = paid, grouped by customer_id
- Last contact: Most recent `activities` row per customer_id
- Tags: New `customer_tags` table (customer_id, tag) or JSONB array on customers table
- Lead count/status: Join with `leads` table

## Open Questions
- Should tags be stored as a JSONB array on the customer record or a separate junction table?
- Should "Do Not Contact" tag actually prevent the CRM from sending automated emails/agent actions?
- Should CSV export include lead history or just customer profile data?
