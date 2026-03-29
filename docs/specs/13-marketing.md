# Marketing Spec (`/marketing/*`)

## Purpose
The growth engine. Keeps The Finishing Touch top-of-mind with past customers and nurtures leads who aren't ready to buy yet. Must make it easy for Evan to run professional email and SMS campaigns without needing Mailchimp or a marketing degree. Every message goes out looking like it came from a real business, not a template factory.

## Email Configuration
All marketing emails sent from: `evan@thefinishingtouchllc.com`

## Sub-Pages
- `/marketing/contacts` — contact database and segmentation
- `/marketing/templates` — email template builder
- `/marketing/campaigns` — campaign creation, scheduling, and analytics
- `/marketing/automations` — drip sequence management

---

## Page 13a: Marketing Contacts (`/marketing/contacts`)

### Capabilities

#### 1. Contact Table
Columns:
- **Name** — contact name
- **Email** — clickable mailto link
- **Phone** — clickable tel link (for SMS campaigns)
- **Tags** — segment tag chips
- **Status** — Subscribed (green) or Unsubscribed (red)
- **Source** — where the contact came from (CRM sync, CSV import, referral, chatbot)
- **Added** — date added

#### 2. Sync from Customers
- "Sync Customers" button in page header
- Pulls all customers with email addresses from the `customers` table into marketing contacts
- Matching logic: match by email address to prevent duplicates
- New customers since last sync are added automatically
- Tags auto-applied based on customer data:
  - Service type → tag (e.g., "concrete", "driveway")
  - Has completed job → "past-customer"
  - Has active lead → "active-lead"
  - New lead → "new-lead"
- Last sync timestamp shown: "Last synced: 2 hours ago"
- Option: enable auto-sync (runs daily)

#### 3. CSV Import
- "Import CSV" button
- Upload modal:
  - Drag-and-drop or file picker
  - Column mapping step: match CSV columns to contact fields (name, email, phone, tags)
  - Preview first 5 rows before importing
  - Duplicate detection: skip or update existing contacts
- Import summary: "Imported 47 new contacts, skipped 3 duplicates"

#### 4. Tag Management
- Add/remove tags per contact inline
- Bulk tag: select multiple contacts, apply or remove tags
- Preset tags: past-customer, active-lead, new-lead, concrete, stamped-concrete, driveway, post-frame, landscaping, curbing, firewood, commercial, premium, referral
- Custom tags: free-text entry
- Tag filter panel: click tags to filter the contact list

#### 5. Unsubscribe Management
- Unsubscribed contacts show red "Unsubscribed" badge
- Cannot be added to campaigns or automations
- Cannot be manually re-subscribed (requires new opt-in from the contact)
- Unsubscribe reasons logged if provided
- Unsubscribe link included in every email footer (legally required)
- Admin can see unsubscribe history: who unsubscribed, when, from which campaign

#### 6. Search & Filters
- Search by name, email, or phone
- Filter by tags (multi-select)
- Filter by status (subscribed/unsubscribed)
- Filter by source
- Result count: "Showing 34 of 142 contacts"

---

## Page 13b: Email Templates (`/marketing/templates`)

### Capabilities

#### 1. Template Card Grid
- Each template shows: category badge, name, subject line, body preview, merge fields
- Actions: Preview, Duplicate, Edit, Delete

#### 2. Visual Email Builder
- "New Template" or "Edit" opens a drag-and-drop email builder
- Block types:
  - **Header** — company logo + optional banner image
  - **Text block** — rich text with bold, italic, links
  - **Image** — upload or select from library
  - **Button** — CTA button with customizable text, URL, and color
  - **Divider** — horizontal line separator
  - **Footer** — company info, unsubscribe link (auto-included, cannot be removed)
- Blocks are drag-reorderable
- Brand defaults: company colors, fonts, logo pre-loaded
- Merge fields insertable via dropdown: `{{first_name}}`, `{{company_name}}`, `{{review_link}}`, `{{referral_link}}`
- Mobile preview toggle: see how the email renders on a phone screen
- "Send Test" button: sends the rendered email to Evan's address

#### 3. Template Categories
- Seasonal Promo
- New Service Announcement
- Project Showcase (before/after from Vision Studio)
- Review Request
- Referral Program
- Custom

#### 4. Template Preview Modal
- Full render of the email with sample merge field data
- Shows both desktop and mobile views
- "Use in Campaign" button to jump to campaign creation with this template selected

---

## Page 13c: Campaigns (`/marketing/campaigns`)

### Capabilities

#### 1. Campaign List
Each campaign card shows:
- Name, status badge (Draft, Scheduled, Sending, Sent)
- Template used, target segment tags
- Recipient count
- Stats (for sent campaigns): opens, clicks, unsubscribes with percentages
- Scheduled date/time (for scheduled campaigns)
- Expand for detailed analytics

#### 2. Campaign Creation
- "New Campaign" opens a multi-step flow:
  1. **Template** — select an email template (or create new)
  2. **Audience** — select segment by tags, with preview of matching contacts and count
  3. **Subject line** — enter subject, option to set up A/B test
  4. **Review** — preview the email rendered with real contact data, see audience size
  5. **Schedule or Send** — send now or pick a future date/time

#### 3. Campaign Scheduling
- Date picker + time picker with timezone display (Eastern Time)
- "Send Now" or "Schedule for [date] at [time] ET"
- Scheduled campaigns can be edited or cancelled before send time
- Sends at exactly the scheduled time via background job

#### 4. A/B Testing
- Toggle "A/B Test" on the subject line step
- Enter Subject A and Subject B
- Configuration:
  - Test group size: default 10% each (20% total test, 80% winner)
  - Wait time: how long to wait before picking the winner (default: 2 hours)
  - Winner criteria: higher open rate (default) or higher click rate
- Flow: sends Subject A to 10%, Subject B to 10%, waits, auto-sends the winner to remaining 80%
- Results shown on the campaign detail: which subject won and by how much

#### 5. Open/Click Tracking Dashboard
Per campaign (expanded detail or dedicated view):
- **Summary stats** — total sent, opens (count + %), clicks (count + %), unsubscribes (count + %)
- **Open timeline** — chart showing opens over time (first 48 hours)
- **Link click breakdown** — which links were clicked and how many times
- **Contact-level detail** — table of every recipient showing:
  - Name, email
  - Opened: Yes/No with timestamp
  - Clicked: Yes/No with which link
  - Unsubscribed: Yes/No
  - Click contact name to open their customer/contact detail

#### 6. SMS Campaigns
- Campaign type selector: Email or SMS
- SMS campaign flow:
  1. **Message** — text editor with character count (160 char limit per segment), merge fields
  2. **Audience** — select by tags, filtered to contacts with phone numbers
  3. **Review** — preview rendered message, recipient count
  4. **Schedule or Send**
- SMS compliance:
  - Contacts must have SMS opt-in (separate from email subscription)
  - "STOP" reply auto-unsubscribes from SMS
  - Opt-in checkbox on customer intake form
- SMS sent via Twilio API
- Tracking: delivery status (sent, delivered, failed)

#### 7. Campaign Filters
- Filter by status: All, Draft, Scheduled, Sending, Sent
- Filter by type: Email, SMS
- Date range filter

---

## Page 13d: Automations (`/marketing/automations`)

### Capabilities

#### 1. Automation List
Each automation card shows:
- Name, description, status badge (Active, Paused, Draft)
- Trigger description
- Email count in sequence
- Enrolled count, completed count
- Play/Pause toggle
- Expand to see full email sequence

#### 2. Automation Builder
- "New Automation" opens a builder:
  - **Name and description**
  - **Trigger** — dropdown:
    - New lead created
    - Lead status changes to [status]
    - Job completed
    - Customer created
    - Tag added: [tag]
    - Manual enrollment
  - **Email sequence** — ordered list of emails:
    - Each email: subject, body (template editor), delay (days after previous)
    - Add/remove/reorder emails
    - First email delay = days after trigger
  - **Exit conditions** — stop the sequence if:
    - Customer replies
    - Lead status changes
    - Customer unsubscribes
    - Manual removal

#### 3. Enrollment Visibility
- Per automation: "View Enrolled" button
- Shows a table of all contacts currently in the automation:
  - Contact name, email
  - Current step (which email they're on)
  - Enrolled date
  - Next email date
  - Status: Active, Completed, Exited (with reason)
- Bulk actions: remove selected contacts from automation
- Individual action: skip to next step, or remove

#### 4. Automation Performance
Per automation:
- Total enrolled, total completed, total exited
- Per-email stats: sent count, open rate, click rate
- Funnel visualization: how many contacts make it through each step
- Drop-off point identification: which email causes the most exits

---

## Page 13e: Referral Program

### Capabilities

#### 1. Referral Campaign Type
- Special campaign type: "Referral Program"
- Creates a unique referral link per contact: `thefinishingtouchllc.com/ref/[code]`
- When someone visits the referral link:
  - Landing page: "You've been referred by [Name]! Get a free quote."
  - Lead capture form: name, phone, email, project type
  - On submit: lead created in CRM with source "Referral" and referrer tracked

#### 2. Referral Tracking
- Dashboard showing:
  - Total referral links generated
  - Total clicks
  - Total leads from referrals
  - Total jobs booked from referrals
  - Revenue attributed to referrals

#### 3. Referral Leaderboard
- Ranked list of referrers by leads generated
- Shows: referrer name, referral count, leads converted, status of each referral
- Top referrers highlighted

#### 4. Referral Rewards (Manual)
- When a referral converts to a booked job:
  - Notification to Evan: "[Referrer] referred [New Customer] who just booked a $4,500 patio"
  - Reminder to send reward (gift card, discount on next service, etc.)
  - Reward tracked on the referrer's customer record
- Future: automated reward fulfillment (stretch goal)

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Spring campaign | Syncs customers, filters by "past-customer" + "concrete" tags, creates an email campaign with the spring promo template, A/B tests two subject lines, schedules for Monday 9am |
| Evan | Checking results | Opens the sent campaign, sees 42% open rate, clicks into contact-level detail to see who engaged, follows up with the clickers |
| Evan | SMS blast | Creates an SMS campaign: "Spring scheduling is filling up! Reply YES for a free estimate." Sends to all subscribed contacts with phone numbers |
| Evan | Referral launch | Sets up referral program campaign, sends to top 20 past customers. Checks leaderboard weekly to see who's bringing in new business |
| Evan | Drip nurture | Creates automation triggered by "new lead created" — 3-email sequence over 10 days. Monitors enrollment, sees 60% make it to email 3 |
| Jake | Template creation | Opens the visual builder, drags in a header with logo, adds a before/after image block from Vision Studio, adds a CTA button linking to the booking page |

## Data Sources
- Contacts: Supabase `marketing_contacts` table
- Templates: Supabase `email_templates` table (body stored as JSON block structure for visual builder)
- Campaigns: Supabase `campaigns` table
- Campaign recipients: Supabase `campaign_recipients` table (campaign_id, contact_id, status, opened_at, clicked_at)
- Automations: Supabase `automations` table
- Automation enrollments: Supabase `automation_enrollments` table (automation_id, contact_id, current_step, status, enrolled_at)
- Referrals: Supabase `referrals` table (referrer_id, referred_contact_id, code, status, created_at)
- Email: Send via `evan@thefinishingtouchllc.com`
- SMS: Twilio API
- Tracking: pixel tracking for opens, redirect tracking for clicks

## Open Questions
- Should the visual email builder support custom HTML blocks for advanced users?
- Should SMS campaigns support MMS (image messages) for before/after photos?
- Should referral links expire after a certain period?
- Should automation exit conditions be AND or OR logic when multiple are set?
- CAN-SPAM compliance: should there be a physical mailing address in the email footer?
