# Invoices Spec (`/invoices`)

## Purpose
The money page. Where quotes become payments. Must give Evan an instant read on cash flow health, make it effortless to chase overdue payments, and support both digital (Stripe) and manual (cash/check) payment tracking.

## Email Configuration
All invoices and payment reminders sent from: `evan@thefinishingtouchllc.com`

## Capabilities

### 1. Invoice Stats Bar
Row of 4 metric cards at top:
- **Total Outstanding** — sum of all unpaid invoices (sent, viewed, overdue)
- **Paid This Month** — sum of payments received in current month
- **Overdue** — count of overdue invoices with total dollar amount
- **Avg Days to Pay** — mean days between sent_at and paid_at for paid invoices

### 2. Revenue Chart
- Small bar chart below stats showing paid revenue by week for the last 90 days
- Bars colored by payment method (Stripe = blue, Cash = green, Check = amber)
- Hover/tap shows exact amount per bar
- Collapsible to save space

### 3. Aging Report
- Horizontal stacked bar showing outstanding invoice breakdown:
  - **Current (0-30 days)** — green
  - **31-60 days** — amber
  - **61-90 days** — orange
  - **90+ days** — red
- Each segment shows dollar amount and invoice count
- Click a segment to filter the table to that aging bucket

### 4. Invoice Table
Columns:
- **Invoice #** — clickable link to detail
- **Customer** — name
- **Amount** — formatted currency
- **Status** — badge: Draft, Sent, Viewed, Paid, Overdue, Cancelled
- **Sent** — date sent or dash
- **Due Date** — formatted, red text if past due
- **Payment Link** — truncated Stripe URL with copy button (click copies full URL for texting to customer)
- **Actions** — quick action buttons per row

### 5. Search & Filters
- **Search** — by customer name or invoice number
- **Status filter** — dropdown: All, Draft, Sent, Viewed, Paid, Overdue, Cancelled
- **Date range** — This Month, Last 30 Days, Last 90 Days, This Year, Custom
- Active filter chips with clear all

### 6. Quick Send Reminder
- "Remind" button on each overdue or sent invoice row
- Sends a payment reminder email from `evan@thefinishingtouchllc.com`:
  - Subject: "Friendly Reminder — Invoice [#] from The Finishing Touch"
  - Body: invoice summary, amount due, due date, Stripe payment link
- Button shows "Sent ✓" state after sending, resets after 24 hours
- Logs activity: "Payment reminder sent"

### 7. Mark as Paid (Cash/Check)
- "Mark Paid" button on sent/viewed/overdue invoices
- Opens a small modal:
  - **Payment method** — radio: Cash, Check, Other
  - **Check number** — text field (shown only when Check selected)
  - **Date received** — date picker, defaults to today
  - **Notes** — optional text
- On confirm:
  - Invoice status changes to "Paid"
  - Payment record created in `payments` table
  - Activity logged: "Payment received — [method]"

### 8. Payment Link Column
- Each sent/overdue invoice shows its Stripe Checkout URL
- Displayed as truncated link with copy icon button
- Click copy → copies full URL to clipboard with toast: "Payment link copied"
- Use case: Evan texts the link to a customer who doesn't check email

### 9. Batch Actions
- Checkbox on each row
- "Select all" checkbox in header
- Bulk action toolbar when 1+ selected:
  - **Send Reminders** — sends reminder email to all selected overdue invoices
  - **Download PDFs** — downloads ZIP of selected invoice PDFs
  - **Mark as Paid** — opens batch payment modal (same method applied to all)
  - **Cancel** — clears selection

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Weekly cash flow check | Opens invoices, glances at stats — $8,200 outstanding, $3,400 paid this month, 2 overdue. Checks aging report — one invoice at 45 days |
| Evan | Chasing overdue payment | Sees an overdue invoice, clicks "Remind" — customer gets a polite email with payment link. Also copies the Stripe link and texts it |
| Evan | Customer pays cash on site | Opens the invoice, clicks "Mark Paid", selects Cash, confirms. Invoice moves to Paid, shows up in this month's revenue |
| Evan | End of month accounting | Filters to "This Month" + "Paid", sees all payments received, downloads PDFs for bookkeeper |
| Jake | Batch follow-up Friday | Selects all 4 overdue invoices, clicks "Send Reminders" — all customers get reminded in one action |
| Evan | Revenue trend check | Looks at the 90-day revenue chart — sees a dip in week 3, realizes he was on vacation and nobody sent invoices |

## Data Sources
- Invoices: Supabase `invoices` table
- Payments: Supabase `payments` table
- Customers: Join with `customers` table
- Aging calculation: Computed from `sent_at` vs current date
- Revenue chart: Aggregate from `payments` grouped by week
- Stripe payment links: Generated via Stripe API, stored on invoice record
- Email: Send via `evan@thefinishingtouchllc.com`

## Open Questions
- Should the aging report include a "Send all reminders" button for an entire bucket?
- Should paid invoices auto-archive after 90 days to keep the list clean?
- Should there be an "Expected this month" metric based on outstanding invoices with due dates in the current month?
