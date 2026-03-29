# Settings Spec (`/settings`)

## Purpose
The control panel. Everything that configures how the CRM behaves — company branding, team members, default values, integrations, and system preferences. Must be organized so Evan can find what he needs fast, but comprehensive enough to support the full platform without hunting through code or Supabase dashboards.

## Layout
Settings organized as a left-side nav with sections:
- Company Profile
- Team Members
- Notifications
- Estimates & Invoices
- AI Agents
- Integrations
- Availability
- Billing
- Audit Log
- Data Management

---

## Capabilities

### 1. Company Profile
Editable fields:
- **Company name** — "The Finishing Touch LLC"
- **Phone** — primary business phone
- **Email** — primary business email (`evan@thefinishingtouchllc.com`)
- **Address** — street, city, state, zip
- **Website** — URL
- **Logo** — upload company logo (used on PDFs, emails, customer-facing pages)
  - Accepts PNG, JPG, SVG
  - Preview at various sizes (PDF header, email header, sidebar)
  - Stored in Supabase Storage `company-assets` bucket
- **Google Review URL** — link to Google Business Profile for review requests
- **Service area** — text description (e.g., "Howard County, IN and surrounding areas")

All fields auto-save on blur with confirmation toast. Values used across:
- Estimate and invoice PDFs
- Email templates (merge field `{{company_name}}`, `{{company_phone}}`)
- Customer-facing pages (payment page, estimate approval, vision share)
- Sidebar logo

### 2. Team Members
- **Table** of all team members: name, email, role, phone, status (active/inactive)
- **Add team member** button:
  - Name, email (required), phone, role dropdown (Admin, Manager, Crew, Sales Rep)
  - "Send Invite" sends an email invitation to set up their account (Supabase auth)
  - Invited but not yet joined: shows "Pending" status
- **Edit** — inline edit any field
- **Deactivate** — soft disable (hides from dropdowns, preserves history), reversible
- **Delete** — only for members with no associated data, otherwise must deactivate
- **Role permissions:**
  - **Admin** — full access to everything including settings, billing, team management
  - **Manager** — full CRM access, can approve agent actions, cannot manage billing or team
  - **Crew** — read-only on most pages, can view their assigned jobs and calendar
  - **Sales Rep** — full CRM access except settings and billing

### 3. Notification Preferences
Per-user notification matrix:

| Event | In-App | Email | SMS |
|-------|--------|-------|-----|
| New lead created | ✓ | ✓ | ○ |
| Lead assigned to me | ✓ | ✓ | ✓ |
| Quote follow-up due | ✓ | ○ | ○ |
| Payment received | ✓ | ✓ | ○ |
| Invoice overdue | ✓ | ✓ | ○ |
| Agent action pending | ✓ | ✓ | ○ |
| Estimate accepted | ✓ | ✓ | ✓ |
| Calendar event tomorrow | ✓ | ○ | ✓ |
| Customer unsubscribed | ✓ | ○ | ○ |

- ✓ = default on, ○ = default off
- Each cell is a toggle the user can flip
- SMS notifications require phone number on the team member record
- "Mute all" toggle for vacation mode

### 4. Estimate Defaults
- **Default margin %** — number input (default: 25%)
- **Default expiration days** — number input (default: 30)
- **Default terms & conditions** — rich text editor
  - Pre-filled with standard T&C: payment terms, warranty, change order policy
  - Applied to all new estimates, editable per-estimate
- **Tax rate %** — number input (default: 7%, Indiana rate)
- **Invoice number format** — template string: `TFT-{YYYY}-{####}` with preview
- **Estimate number format** — template string: `EST-{####}` with preview

### 5. Invoice Defaults
- **Default payment terms** — dropdown: Due on Receipt, Net 15, Net 30, Net 60
- **Tax rate %** — shared with estimate defaults
- **Invoice number format** — shared with estimate defaults
- **Payment instructions** — text that appears on invoice PDF footer
  - Default: "Pay online via the link above, or mail checks to: [company address]"
- **QuickBooks export settings:**
  - Default income account name
  - Default tax account name
  - Export format: CSV (default), QBO (stretch goal)
  - Batch export frequency reminder: weekly/monthly/manual

### 6. AI Agent Global Settings
- **Default approval mode** — Auto-send or Requires Approval (applies to new agents)
- **Business hours** — start/end time for agent message sending (default: 8am-6pm ET)
- **Business days** — checkboxes for Mon-Sun (default: Mon-Fri)
- **Google Review link** — URL (shared with company profile)
- **SMS provider** — Twilio credentials (Account SID, Auth Token, Phone Number)
- **Agent email signature** — text appended to all agent-sent emails
  - Default: "- Evan Ellis, The Finishing Touch LLC | (765) XXX-XXXX"

### 7. Integrations
Integration cards with connect/disconnect and status indicator:

#### Stripe
- Status: Connected / Not Connected
- Connect: enter Stripe Secret Key + Webhook Secret
- Test: "Send test webhook" button
- Shows: last successful webhook timestamp

#### Google Calendar
- Status: Connected / Not Connected
- Connect: OAuth flow → Google account authorization
- Settings: which calendar to sync, sync direction (two-way / CRM→Google only)
- Shows: last sync timestamp, sync errors if any

#### Google Places (Address Autocomplete)
- Status: Configured / Not Configured
- Configure: enter Google Places API key
- Test: type a test address, see if autocomplete works

#### Twilio (SMS)
- Status: Connected / Not Connected
- Configure: Account SID, Auth Token, From Phone Number
- Test: "Send test SMS" to Evan's phone
- Shows: SMS balance / usage

#### Gmail (Outbound Email)
- Status: Connected / Not Connected
- Current: using Resend as relay
- Future: direct Gmail API OAuth for sending from `evan@thefinishingtouchllc.com`
- Shows: daily send count, quota remaining

#### QuickBooks Online
- Status: Connected / Not Connected
- Connect: OAuth flow → QuickBooks Online authorization
- Settings: default income account, default tax account, auto-sync toggle
- Auto-sync: when an invoice is marked paid, auto-push to QuickBooks as a paid invoice
- Manual sync: "Sync Now" button to push all unsynced invoices
- Sync log: shows last sync, items synced, any errors
- API key to be provided by user at end of build

Each integration card shows:
- Connection status (green dot / red dot)
- Last activity timestamp
- "Test Connection" button
- "Disconnect" button with confirmation

### 8. Availability Rules
Per team member schedule:
- **Weekly grid** — 7 days × time range
- Each day: toggle enabled/disabled + start time + end time
- Default: Mon-Fri 7:00am-5:00pm, Sat-Sun off
- Example for Evan:
  - Mon: 7:00am - 5:00pm
  - Tue: 7:00am - 5:00pm
  - Wed: 7:00am - 12:00pm (half day)
  - Thu: 7:00am - 5:00pm
  - Fri: 7:00am - 5:00pm
  - Sat: OFF
  - Sun: OFF
- Used by:
  - Calendar: availability background shading
  - Vapi agent: `check_availability` tool
  - Appointment booking: only offers available slots
- "Copy to all" button: apply one day's schedule to all weekdays

### 9. Billing / Subscription
- **Current plan** — Free / Pro / Enterprise (placeholder for SaaS model)
- **Usage stats:**
  - Team members: 3 of 5 allowed
  - AI Vision generations: 12 of 50 this month
  - Email sends: 234 of 1,000 this month
  - SMS sends: 18 of 100 this month
  - Storage: 156 MB of 1 GB
- **Payment method** — credit card on file (Stripe billing)
- **Billing history** — list of past invoices with download links
- **Upgrade/downgrade** — plan comparison and change flow
- Note: this section is scaffolded for future SaaS launch, not fully functional in v1

### 10. Audit Log
- Chronological log of all settings changes:
  - Who changed what, when
  - Old value → new value
  - Examples:
    - "Evan changed default margin from 25% to 30% — Mar 28, 2026 2:14pm"
    - "Jake was added as a team member — Mar 25, 2026"
    - "Stripe integration connected — Mar 20, 2026"
- Filter by: user, date range, setting category
- Read-only — cannot edit or delete audit entries
- Retained indefinitely

### 11. Data Management
- **Export all data** — download everything as a ZIP:
  - customers.csv, leads.csv, estimates.csv, invoices.csv, payments.csv, activities.csv, contacts.csv
  - Useful for: migration, backup, legal compliance
- **Clear demo data** — removes all demo/seed data from the database
  - Confirmation: "This will permanently delete all demo data. Real data you've entered will not be affected. Type 'DELETE DEMO DATA' to confirm."
  - Only available when data mode is "Demo"
- **Danger zone:**
  - "Reset CRM" — wipes all CRM data (customers, leads, invoices, etc.)
  - Triple confirmation required
  - Only visible to Admin role

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Initial setup | Uploads company logo, enters phone/email/address, connects Stripe, connects Google Calendar, sets up availability for the team |
| Evan | Adding a crew member | Goes to Team Members, adds Travis with Crew role, sends invite. Travis gets an email, creates his account, can see his assigned jobs |
| Evan | Adjusting margins | Concrete prices went up — opens Estimate Defaults, changes margin from 25% to 30%. All new estimates use the new margin |
| Evan | Connecting SMS | Opens Integrations, enters Twilio credentials, sends a test SMS to his phone, confirms it works. Agent SMS and appointment reminders now functional |
| Evan | Going on vacation | Opens Notification Preferences, toggles "Mute all" — no notifications for a week. Sets Jake as the default lead assignee |
| Evan | Launching for real | Goes to Data Management, clicks "Clear Demo Data", confirms. CRM is now clean and ready for real customers |
| Evan | Checking who changed what | Something seems off with invoice terms — opens Audit Log, searches for "payment terms", sees Jake changed it 2 days ago |

## Data Sources
- Company profile: Supabase `company_settings` table (single row, key-value or JSON)
- Team members: Supabase `team_members` table
- Notification preferences: Supabase `notification_preferences` table (user_id, event, channel, enabled)
- Availability: Supabase `availability_rules` table
- Integrations: Supabase `integrations` table (provider, credentials encrypted, status, last_activity)
- Audit log: Supabase `audit_log` table (user_id, action, category, old_value, new_value, created_at)
- Billing: Stripe Billing API (stretch goal)

## Open Questions
- Should integration credentials be stored encrypted in Supabase or in environment variables only?
- Should there be a "White label" option for reselling the CRM to other contractors?
- Should availability rules support exceptions (holidays, one-off blocked days)?
- Should the billing section be live for v1 or scaffolded as coming soon?
