# Dashboard Spec (`/dashboard`)

## Purpose
The command center. First thing Evan sees at 6am before the crew heads out. Must answer three questions instantly: what's happening today, what needs attention, and how's the business doing.

## Capabilities

### 1. Business Health Stats (Top Row)
- **Leads this month** — count with % change vs last month
- **Quotes sent** — active quotes awaiting response
- **Jobs booked** — booked + in progress count
- **Completed revenue** — this month with trend vs last month
- **Outstanding invoices** — total unpaid dollar amount
- **Close rate** — quotes sent vs jobs booked as a percentage
- **Avg job size** — mean revenue per completed job this month

### 2. Revenue Goal Tracker
- Monthly revenue target (configurable in settings)
- Progress bar showing actual vs target
- Projected month-end based on current pipeline + booked jobs
- Visual indicator: on track (green), behind (amber), critical (red)

### 3. Today's Schedule Preview
- List of today's calendar events pulled from `/calendar` data
- Each entry shows: time, customer name, address, job type, assigned crew member
- Tap to expand for customer phone (click-to-call) and job notes
- "View full calendar" link

### 4. Actionable Follow-ups
Each follow-up card must support inline actions:
- **New leads** — buttons: Call, Text, Email, Snooze (1 day / 3 days / 1 week), Dismiss
- **Quoted leads** — buttons: Call, Resend Quote, Snooze, Mark Lost
- **Pending agent approvals** — buttons: Approve, Reject, Edit & Send
- **Overdue invoices** — buttons: Call, Resend Invoice, Mark Paid
- Clicking Call opens `tel:` link; Text opens SMS compose; Email triggers send-email flow
- Snooze removes from list until the chosen date
- Dismiss marks as handled (logs activity)

### 5. Weather Widget
- 5-day forecast for Greentown, IN / Howard County service area
- Shows: day, high/low temp, conditions icon, precipitation %
- Highlights days that are bad for concrete work (rain, below freezing)
- Data source: OpenWeatherMap or WeatherAPI free tier

### 6. Pipeline Summary
- Horizontal bar chart showing lead count per pipeline stage
- Each bar is clickable — navigates to `/leads` filtered by that stage
- Shows total dollar value per stage

### 7. AI Agent Activity
- Count of active agents, actions today, pending approvals
- List of pending approval items with approve/reject buttons
- "All clear" state when no pending items

### 8. Recent Activity Timeline
- Last 10 activities across all leads/customers
- Each entry: icon by type, description, timestamp
- Clicking an activity navigates to the relevant lead or customer

### 9. Quick Actions Bar
- Add New Lead → `/customers/new`
- Create Estimate → `/estimates/new`
- Send Invoice → `/invoices/new`
- Open Vision Studio → `/vision`
- View Agent Queue → `/agents`

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | 6am crew dispatch | Opens dashboard, checks today's schedule, sees overnight Vapi leads, taps Call on the hottest one |
| Evan | End of month review | Checks revenue goal tracker, sees close rate and avg job size, decides whether to push more quotes |
| Jake | Morning follow-up round | Scans follow-ups, calls quoted leads directly from the card, snoozes ones that didn't answer |
| Evan | Rainy week ahead | Sees weather widget showing rain Wed-Fri, goes to calendar to reschedule outdoor pours |
| Evan | Overdue payment | Sees overdue invoice alert, taps Resend Invoice, follows up with a call |

## Data Sources
- Stats: Supabase queries on `leads`, `invoices`, `payments` tables
- Calendar: Supabase `calendar_events` table, filtered to today
- Weather: External API call (cached 1hr)
- Follow-ups: Computed from leads (status=new, status=quoted), agent_actions (status=pending_approval), invoices (status=overdue)
- Activity: Supabase `activities` table, ordered by created_at desc

## Open Questions
- Should revenue goal be per-user or company-wide?
- Should weather widget be collapsible/hideable for users who don't want it?
