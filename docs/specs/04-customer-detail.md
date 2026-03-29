# Customer Detail Spec (`/customers/[id]`)

## Purpose
The full 360-degree view of a single customer. Everything The Finishing Touch has ever done with this person — every call, quote, job, payment, and AI interaction — in one place. Must enable instant context when a customer calls back and fast action without hunting through other pages.

## Capabilities

### 1. Customer Profile Header
Top section displays:
- **Name** — large, bold, editable inline
- **Phone** — click-to-call `tel:` link + copy button
- **Email** — clickable `mailto:` link + copy button
- **Address** — full address, clickable to open Google Maps directions
- **Source** — how they found TFT (Google, Referral, Vapi, etc.)
- **Tags** — editable tag chips (VIP, Repeat, Commercial, etc.) with add/remove
- **Date created** — "Customer since Mar 2026"
- **Avatar** — initials circle with brand color

### 2. Lifetime Stats Bar
Row of 4 stat cards below the header:
- **Total Revenue** — sum of all paid invoices
- **Jobs Completed** — count of leads with status "completed"
- **Avg Job Size** — total revenue / jobs completed
- **Customer Since** — days/months since first lead created

### 3. Quick Actions Sidebar
Persistent panel on the right (desktop) or sticky bottom bar (mobile):
- **Call** — `tel:` link to customer phone
- **Text** — `sms:` link to customer phone
- **Email** — opens email compose flow
- **Schedule Visit** — opens calendar event creator pre-filled with customer name, phone, address
- **Create Estimate** — navigates to `/estimates/new` pre-filled with customer data
- **Create Invoice** — navigates to `/invoices/new` pre-filled with customer data
- **Add Note** — inline text entry, saves to activity timeline

### 4. Activity Timeline
Full chronological history, newest first:
- **Call** — phone icon, description, timestamp
- **Email** — mail icon, subject line, timestamp
- **Quote** — document icon, amount, timestamp
- **Payment** — credit card icon, amount, method, timestamp
- **Note** — sticky note icon, text content, who logged it, timestamp
- **AI Action** — bot icon, what the agent did, status (sent/pending/failed)

Filter bar above timeline:
- Filter by type (calls, emails, quotes, payments, notes, AI)
- All types shown by default
- "Load more" pagination (show 20 at a time)

### 5. Add Activity
Quick-entry form above the timeline:
- Type selector: Call, Email, Note
- Description text field
- Submit button
- On save: appends to timeline, logs created_by as current user

### 6. Associated Leads
Collapsible section showing all leads for this customer:
- Each lead row: project type, status badge, quoted amount, date created, assigned to
- Click to navigate to `/leads/[id]`
- "New Lead" button to create a lead for this customer (pre-fills customer_id)

### 7. Associated Estimates
Collapsible section:
- Each row: project type, status badge, total amount, date created
- Click to navigate to `/estimates/[id]`
- "New Estimate" button (pre-fills customer)

### 8. Associated Invoices
Collapsible section:
- Each row: invoice number, status badge, amount, due date, paid date
- Click to navigate to `/invoices/[id]`
- "New Invoice" button (pre-fills customer)

### 9. Vision Projects
Collapsible section:
- Thumbnail grid of AI visualizations generated for this customer
- Each shows: service type, iteration count, date
- Click to view full before/after comparison

### 10. Edit Customer Info
- All profile fields are inline editable (click to edit)
- Fields: name, email, phone, address, city, state, zip, service type, source, notes
- Auto-saves on blur with confirmation toast
- Edit history logged (stretch goal)

### 11. Delete / Archive Customer
- "Archive Customer" button in a danger zone at bottom of page
- Confirmation modal: "This will archive [Name] and hide them from active lists. Their data will be preserved. Continue?"
- Archived customers can be restored from a settings/admin view
- Hard delete not available from UI (admin-only via Supabase)

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Customer calls back about a quote | Searches their name, opens detail, sees full history — when they called, what was quoted, any notes Jake left. Has full context in 5 seconds |
| Evan | Heading to a job site | Opens customer detail on phone, taps the address, gets Google Maps directions |
| Jake | Post-call logging | Just talked to Mrs. Johnson about her patio timeline, opens her profile, hits Add Note, types "Moving forward in April, wants stamped ashlar" |
| Evan | Repeat customer check | Opens profile for a past customer who called again, sees lifetime value of $12K across 3 jobs, knows to give them priority |
| Evan | Creating follow-up estimate | Customer wants a new project, Evan hits "New Estimate" from their profile — customer data auto-fills, he just enters project details |
| Jake | Reviewing AI interactions | Opens customer detail, sees the AI agent sent a follow-up email 2 days ago, reads what it said before calling so he has context |

## Data Sources
- Customer profile: Supabase `customers` table
- Stats: Aggregates from `invoices` (paid), `leads` (completed)
- Timeline: Supabase `activities` table filtered by customer_id
- Leads: Supabase `leads` table filtered by customer_id
- Estimates: Supabase `estimates` table filtered by customer_id
- Invoices: Supabase `invoices` table filtered by customer_id
- Vision: Supabase `vision_projects` table filtered by customer_id

## Layout
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Customers                                │
├─────────────────────────────────────┬───────────────┤
│ Profile Header                      │ Quick Actions │
│ Name, Phone, Email, Address, Tags   │ Call          │
├─────────────────────────────────────┤ Text          │
│ Stats: Revenue | Jobs | Avg | Since │ Email         │
├─────────────────────────────────────┤ Schedule      │
│ Activity Timeline                   │ Estimate      │
│ [Filter: All | Calls | Emails | …]  │ Invoice       │
│ [Add Activity form]                 │ Add Note      │
│ • Call — spoke about patio — 2h ago │               │
│ • AI — follow-up email sent — 1d    │               │
│ • Quote — $4,500 stamped — 3d       │               │
├─────────────────────────────────────┤               │
│ ▸ Leads (3)                         │               │
│ ▸ Estimates (2)                     │               │
│ ▸ Invoices (1)                      │               │
│ ▸ Vision Projects (1)              │               │
├─────────────────────────────────────┴───────────────┤
│ ⚠ Danger Zone: Archive Customer                    │
└─────────────────────────────────────────────────────┘
```

## Open Questions
- Should there be a "Star" or "Pin" feature to mark favorite/priority customers?
- Should the activity timeline support file attachments (photos from job sites)?
- Should address changes be versioned (customer moved, old address on past invoices)?
