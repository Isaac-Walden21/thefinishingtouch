# Estimate Detail / New Estimate Spec (`/estimates/[id]` and `/estimates/new`)

## Purpose
The estimate builder. Where rough measurements and material choices become a professional, branded quote that wins jobs. Must support both AI-assisted generation for speed and full manual control for precision. The output — a polished PDF with a digital approval link — is the document that turns a lead into revenue.

## Capabilities

### 1. AI-Powered Generation (New Estimate)
- Select project type, enter dimensions, choose materials, set complexity
- "Generate Estimate" button calls the AI pricing engine
- AI produces line items with:
  - Material costs (based on project type and material selection)
  - Labor hours (based on complexity and square footage)
  - Equipment costs (if applicable)
- Generated estimate is fully editable — AI is the starting point, not the final word

### 2. Editable Line Items
- Table with columns: Category (Material/Labor/Equipment), Description, Quantity, Unit, Unit Cost, Total
- **Add row** — button to add a blank line item with category dropdown
- **Remove row** — trash icon per row with confirmation
- **Reorder rows** — drag handle to reorder within categories, or up/down arrows on mobile
- **Inline editing** — click any cell to edit in place
- All changes auto-save (debounced) with visual save indicator

### 3. Real-Time Total Recalculation
- As any line item quantity or unit cost changes:
  - Row total updates: quantity × unit cost
  - Subtotal updates: sum of all row totals
  - Margin amount updates: subtotal × margin percentage
  - Grand total updates: subtotal + margin
- No page reload, no save button required for recalculation
- Currency formatting applied automatically

### 4. Custom Margin Control
- Margin percentage input with slider (range: 0-50%)
- Default: 25% (configurable in settings)
- Shows margin as both percentage and dollar amount
- "What-if" mode: type a target total and it back-calculates the required margin %
- Margin is internal — not shown on customer-facing PDF

### 5. PDF Preview
- Live preview panel on the right side (desktop) or toggle view (mobile)
- Shows exactly what the customer will receive:
  - Company logo and branding
  - Customer name and address
  - Project description and scope
  - Line items table (without margin breakdown — shows final prices)
  - Subtotal and total
  - Terms & conditions
  - External notes
  - Expiration date
  - Digital approval link/QR code
- Preview updates in real-time as edits are made

### 6. Photo Attachments
- "Attach Photos" section below line items
- Drag-and-drop or click to upload
- Pull existing photos from the associated lead/customer record
- Photos appear as thumbnails with captions
- Photos included in the estimate PDF as an appendix
- Max 10 photos per estimate
- Stored in Supabase Storage bucket `estimate-photos`

### 7. Terms & Conditions
- Text editor for T&C content
- Default T&C loaded from company settings (configurable at `/settings`)
- Can be customized per estimate
- Appears at the bottom of the PDF
- Standard content: payment terms, warranty, change order policy, cancellation

### 8. Customer Approval Link
- "Generate Approval Link" button
- Creates a unique, unguessable URL: `/approve/[token]`
- Customer can view the estimate without logging in
- Page shows: full estimate details + "Accept Estimate" button + "Request Changes" button
- On accept:
  - Estimate status changes to "Accepted"
  - Activity logged: "Customer accepted estimate via approval link"
  - Notification sent to Evan (email + in-app)
  - Optional: auto-create invoice
- On "Request Changes":
  - Opens a text field for customer comments
  - Notification sent to Evan with the feedback
  - Estimate status changes to "Revision Requested"
- Link expires with the estimate (30 days default)

### 9. Notes Section
Two separate notes areas:
- **Internal Notes** — visible only to team members, not on PDF
  - Use for: "Customer seems price-sensitive, might need to come down 5%"
  - "Talked to supplier, can get aggregate at $2 less per yard"
- **External Notes** — included on the estimate PDF
  - Use for: "Price includes removal of existing patio slab"
  - "Weather permitting, project can begin within 2 weeks of acceptance"

### 10. Revision History
- Every save creates a revision snapshot
- Revision sidebar shows: Rev 1 (original), Rev 2 (date, who changed it), Rev 3, etc.
- Click a revision to view the estimate as it was at that point
- "Restore this version" button to roll back
- Diff view: highlight what changed between revisions (stretch goal)

### 11. Save as Template
- "Save as Template" button in the actions menu
- Prompts for template name (e.g., "Standard 400sqft Broom Finish Patio")
- Saves line items, materials, options, T&C, margin as a reusable template
- Templates accessible from the "New Estimate" page as a starting point
- Templates manageable from Settings or a dedicated templates list

### 12. Page Header Actions
- **Save** — manual save (in addition to auto-save)
- **Send to Customer** — generates PDF, emails to customer, changes status to Sent
- **Download PDF** — downloads the estimate PDF locally
- **Duplicate** — creates a copy in Draft status
- **Convert to Invoice** — (only when Accepted) creates invoice with all line items
- **Delete** — soft delete with confirmation (only for Draft estimates)

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Building a quote after site visit | Opens new estimate, selects "Stamped Concrete", enters 20x15 dimensions, picks Ashlar Slate, generates. AI creates 8 line items. He adjusts labor hours up (tricky access) and sends |
| Evan | Customer wants a cheaper option | Opens the estimate, adjusts margin from 25% to 20%, removes the sealing line item, total drops $600, sends revised version |
| Evan | Professional presentation | Attaches 3 site photos, writes external note about timeline, previews the PDF to make sure it looks clean, sends |
| Customer | Reviewing at home | Gets email with estimate, clicks approval link, sees branded page with all details, clicks "Accept Estimate" — Evan gets notified instantly |
| Jake | Using a past job as template | Opens a similar past estimate, clicks "Save as Template", names it. Next time, starts a new estimate from that template — line items pre-filled |
| Evan | Customer negotiating | Adjusts line items, revision auto-saved as Rev 2. Customer comes back again, more changes — Rev 3. Can always see what was originally quoted |

## Data Sources
- Estimate: Supabase `estimates` table (JSONB for line_items, dimensions, options)
- Photos: Supabase Storage `estimate-photos` bucket
- Templates: New Supabase `estimate_templates` table
- Revisions: New Supabase `estimate_revisions` table (estimate_id, revision_number, snapshot JSONB, created_by, created_at)
- Approval tokens: New Supabase `estimate_approvals` table (estimate_id, token, status, customer_response, created_at)
- Email: Send via `evan@thefinishingtouchllc.com`

## Layout — Edit Mode
```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Estimates          [Save] [Send] [Download] ▾ │
├────────────────────────────────────┬─────────────────────┤
│ Customer: Steve Morales            │                     │
│ Project: Stamped Concrete Patio    │   PDF PREVIEW       │
│ Status: Draft  Expires: 22 days    │                     │
├────────────────────────────────────┤   [Live updating    │
│ Line Items                         │    preview of the   │
│ ┌──────┬───────┬───┬──────┬──────┐ │    estimate as it   │
│ │ Cat  │ Desc  │Qty│ Unit │Total │ │    will appear to   │
│ ├──────┼───────┼───┼──────┼──────┤ │    the customer]    │
│ │ Mat  │ Conc  │ 3 │ $120 │ $360 │ │                     │
│ │ Mat  │ Stamp │ 1 │ $450 │ $450 │ │                     │
│ │ Lab  │ Pour  │ 8 │  $65 │ $520 │ │                     │
│ │ [+ Add Line Item]               │ │                     │
│ ├──────────────────────────────────┤ │                     │
│ │ Subtotal         $1,330         │ │                     │
│ │ Margin (25%)       $333         │ │                     │
│ │ Total            $1,663         │ │                     │
│ └──────────────────────────────────┘ │                     │
│                                      │                     │
│ 📎 Photos (2)  [+ Add Photos]       │                     │
│ [thumb] [thumb]                      │                     │
│                                      │                     │
│ Internal Notes                       │                     │
│ [________________________________]  │                     │
│                                      │                     │
│ External Notes (on PDF)             │                     │
│ [________________________________]  │                     │
│                                      │                     │
│ Terms & Conditions                  │                     │
│ [________________________________]  │                     │
├──────────────────────────────────────┤                     │
│ Revisions: Rev 1 ● Rev 2 ○ Rev 3 ○ │                     │
└──────────────────────────────────────┴─────────────────────┘
```

## Open Questions
- Should the customer approval page support e-signature (draw or type)?
- Should accepted estimates auto-trigger invoice creation or require manual conversion?
- Should templates be shareable across team members or per-user?
- Should the PDF include a QR code linking to the digital approval page?
