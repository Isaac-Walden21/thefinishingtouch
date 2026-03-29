# Invoice Detail / New Invoice Spec (`/invoices/[id]` and `/invoices/new`)

## Purpose
The money document. A professional, branded invoice that gets sent to the customer and makes it dead simple to pay. Must support the full lifecycle from creation to payment confirmation, integrate with Stripe for online payments, and play nice with QuickBooks for Evan's accounting workflow.

## Email Configuration
All invoice emails and receipts sent from: `evan@thefinishingtouchllc.com`

## QuickBooks Integration Note
Evan uses QuickBooks for accounting. The CRM is not replacing QuickBooks — it's the front-end for customer-facing invoicing and payment collection. Key integration points:
- **Export to QuickBooks** — one-click export of invoice data in QuickBooks-compatible format (CSV or QBO)
- **Batch export** — end-of-week/month export of all paid invoices for bookkeeper
- **QuickBooks API sync** — auto-push paid invoices to QuickBooks Online via API (user will provide API key at end of build)
- Invoice numbers should follow a format compatible with QB (e.g., TFT-0001)

## Capabilities

### 1. Invoice Header
- **Invoice number** — auto-generated (TFT-0001 format), editable
- **Customer** — name, linked to customer detail. Dropdown to change (for new invoices)
- **Status badge** — Draft, Sent, Viewed, Paid, Cancelled
- **Linked estimate** — if created from an estimate, shows link: "From Estimate #[id]"
- **Created date** — auto-set
- **Due date** — date picker, defaults to 30 days from creation
- **Payment link** — Stripe Checkout URL with copy button

### 2. Editable Line Items
- Table: Description, Quantity, Unit Price, Total
- **Add row** — blank line item
- **Remove row** — trash icon with confirmation
- **Reorder** — drag handle (desktop), up/down arrows (mobile)
- **Inline editing** — click any cell to edit
- Auto-save on changes (debounced)

### 3. Totals Section
- **Subtotal** — sum of line item totals
- **Tax rate** — percentage input (default from settings)
- **Tax amount** — calculated from subtotal × tax rate
- **Total** — subtotal + tax
- All recalculate in real-time as line items change

### 4. Deposit / Split Payment
- "Split Invoice" toggle in the header
- When enabled:
  - **Deposit invoice** — configurable percentage (default 50%), due immediately
  - **Final invoice** — remaining balance, due on completion
  - Both invoices linked to the same estimate and customer
  - Each gets its own invoice number (TFT-0042-DEP, TFT-0042-FIN)
  - Deposit invoice created and sent first
  - Final invoice auto-created as Draft when deposit is paid
- Status tracking shows both invoices and their payment state

### 5. PDF Preview
- Live preview panel (right side desktop, toggle on mobile)
- Shows branded invoice exactly as customer will see it:
  - Company logo and contact info
  - Customer name and address
  - Invoice number and dates
  - Line items table
  - Totals with tax breakdown
  - Payment instructions (Stripe link + check mailing address)
  - External notes
- Updates in real-time as edits are made

### 6. Payment Status Timeline
Visual horizontal timeline at top of the detail page:
- **Created** — date, by whom
- **Sent** — date sent, email address
- **Viewed** — date customer opened the email/link (if tracked)
- **Paid** — date, amount, method (Stripe/Cash/Check)
Each step shows a checkmark when complete, current step highlighted

### 7. Customer View Tracking
- When customer opens the invoice email: tracking pixel logs the view
- When customer visits the `/pay/[id]` page: logged via API
- Detail page shows: "Viewed by customer on [date] at [time]"
- If not viewed after 3 days: amber indicator suggesting a reminder
- View events logged as activities on the customer record

### 8. Payment Confirmation
- When paid via Stripe (webhook):
  - Invoice status auto-changes to "Paid"
  - Payment record created with Stripe payment ID
  - Receipt email auto-sent from `evan@thefinishingtouchllc.com`:
    - Subject: "Payment Received — Thank You! | The Finishing Touch"
    - Body: payment amount, invoice number, brief thank-you message
  - Activity logged on customer record
  - In-app notification to Evan
- When marked paid manually (cash/check):
  - Same flow minus the Stripe webhook
  - No auto-receipt email (optional manual send)

### 9. Attach to Estimate
- "Link Estimate" dropdown on the invoice
- Shows estimates for this customer
- When linked:
  - Invoice detail shows "From Estimate #[id]" with clickable link
  - Estimate detail shows "Invoiced as #[invoice-number]" with clickable link
  - Line items can be pulled from the estimate with one click

### 10. Notes
- **Internal notes** — visible only to team, not on PDF or customer view
  - "Customer said they'll pay Friday"
  - "Deducted $200 for the cracked section we need to redo"
- **External notes** — printed on the invoice PDF
  - "Thank you for choosing The Finishing Touch!"
  - "Please make checks payable to The Finishing Touch LLC"

### 11. Void / Cancel
- "Cancel Invoice" button in actions menu
- Modal with required reason field
- On cancel:
  - Status changes to "Cancelled"
  - If invoice was already sent: sends cancellation email to customer
    - Subject: "Invoice [#] Cancelled — The Finishing Touch"
    - Body: brief note that the invoice has been cancelled + reason (if appropriate)
  - Stripe payment link deactivated
  - Activity logged
- Cancelled invoices remain in the system for records but excluded from outstanding totals

### 12. Resend
- "Resend" button (visible when status is Sent, Viewed, or Overdue)
- Resends the invoice email with PDF attachment
- Logs activity: "Invoice resent"
- Shows toast: "Invoice resent to [email]"

### 13. QuickBooks Export
- "Export to QuickBooks" button in actions menu
- Exports single invoice as QuickBooks-compatible CSV:
  - Fields: Invoice Number, Customer Name, Date, Due Date, Line Item Description, Quantity, Rate, Amount, Tax, Total, Payment Status, Payment Date, Payment Method
- Batch export available from the invoices list page

### 14. Page Header Actions
- **Save** — manual save
- **Send to Customer** — generates PDF, emails, changes status to Sent
- **Resend** — resend email
- **Download PDF** — downloads locally
- **Copy Payment Link** — copies Stripe URL to clipboard
- **Export to QuickBooks** — downloads QB-compatible CSV
- **Cancel Invoice** — void with reason
- **Delete** — only for Draft invoices, soft delete with confirmation

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Job complete, time to bill | Opens the accepted estimate, clicks "Convert to Invoice", reviews pre-filled line items, adjusts tax, hits Send |
| Evan | Big job, needs deposit | Creates invoice, enables Split Payment at 50%, sends deposit invoice. Customer pays via Stripe. Final invoice auto-created for when the job's done |
| Evan | Customer hasn't opened invoice | Checks detail page, sees "Not viewed" after 4 days, hits Resend. Copies payment link and texts it directly |
| Customer | Paying from phone | Gets text with payment link, taps it, sees branded payment page, pays with credit card. Evan gets notified, receipt auto-sent |
| Evan | Cash payment on site | Customer hands over a check. Evan opens invoice, clicks Mark Paid, selects Check, enters check number |
| Evan | Weekly bookkeeping | Opens invoices list, filters to Paid + This Week, batch exports to QuickBooks CSV, sends to bookkeeper |
| Evan | Billing mistake | Sent wrong amount, clicks Cancel Invoice, enters reason "Incorrect line items", customer gets cancellation email, Evan creates corrected invoice |

## Data Sources
- Invoice: Supabase `invoices` table
- Line items: JSONB array on invoice record
- Payments: Supabase `payments` table
- Estimates: Join with `estimates` table via estimate_id
- View tracking: Supabase `invoice_views` table (invoice_id, viewed_at, source)
- Stripe: Stripe API for payment link generation and webhook processing
- Email: Send via `evan@thefinishingtouchllc.com`
- QB export: Client-side CSV generation

## Layout
```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Invoices     [Save] [Send] [Download] [More ▾]│
├──────────────────────────────────────────────────────────┤
│ Payment Timeline                                         │
│ ● Created (Mar 15) → ● Sent (Mar 15) → ○ Viewed → ○ Paid│
├────────────────────────────────────┬─────────────────────┤
│ Invoice TFT-0042                   │                     │
│ Customer: Steve Morales            │   PDF PREVIEW       │
│ Status: Sent   Due: Apr 14         │                     │
│ From Estimate: #EST-018            │   [Live updating    │
├────────────────────────────────────┤    branded PDF      │
│ Line Items                         │    preview]         │
│ ┌───────────┬───┬───────┬────────┐ │                     │
│ │ Desc      │Qty│ Price │ Total  │ │                     │
│ ├───────────┼───┼───────┼────────┤ │                     │
│ │ Concrete  │ 3 │  $120 │  $360  │ │                     │
│ │ Stamping  │ 1 │  $450 │  $450  │ │                     │
│ │ Labor     │ 8 │   $65 │  $520  │ │                     │
│ │ [+ Add Line Item]               │ │                     │
│ ├──────────────────────────────────┤ │                     │
│ │ Subtotal           $1,330       │ │                     │
│ │ Tax (7%)              $93       │ │                     │
│ │ Total              $1,423       │ │                     │
│ └──────────────────────────────────┘ │                     │
│                                      │                     │
│ Payment Link: pay.stripe.com/... [📋]│                     │
│                                      │                     │
│ Internal Notes                       │                     │
│ [________________________________]  │                     │
│                                      │                     │
│ External Notes (on PDF)             │                     │
│ [________________________________]  │                     │
├──────────────────────────────────────┴─────────────────────┤
│ ⚠ Cancel Invoice                                          │
└────────────────────────────────────────────────────────────┘
```

## Open Questions
- Should QuickBooks integration eventually be a live API sync or is CSV export sufficient?
- Should the receipt email include a "Leave us a review" link (ties into the review request agent)?
- Should there be a "Payment plan" option beyond the deposit/final split (e.g., 3 installments)?
- Should invoice numbers auto-increment globally or reset per year (TFT-2026-0001)?
