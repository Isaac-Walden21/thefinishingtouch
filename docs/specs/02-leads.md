# Lead Pipeline Spec (`/leads`)

## Purpose
The sales engine. Visual pipeline where every potential job lives until it's won or lost. Must make it dead simple to see what needs attention, take action without navigating away, and keep deals moving forward.

## Capabilities

### 1. Kanban Board
- 7 columns: New, Contacted, Quoted, Booked, In Progress, Completed, Lost
- Drag-and-drop to move cards between columns (desktop)
- Status select dropdown fallback (mobile/touch)
- Column headers show: stage name, card count, total dollar value

### 2. Lead Cards
Each card displays:
- Project type (bold, primary text)
- Customer name
- Quoted amount (if set)
- Assigned team member avatar/initials
- Lead age indicator:
  - Green dot: fresh (< 2 days in current stage)
  - Orange dot: aging (3-6 days without activity)
  - Red dot: stale (7+ days without activity)
- Source badge (Google, Facebook, Vapi, Referral, etc.)

### 3. Lead Card Quick Actions
Tapping a card opens a slide-over panel (not a full page nav) with:
- Customer name, phone (click-to-call), email
- Call button (tel: link)
- Text button (sms: link)
- Email button (opens compose flow)
- Add Note (inline text field, saves to activities)
- Schedule Visit (opens calendar event creator pre-filled with customer info)
- Create Estimate (navigates to `/estimates/new` pre-filled with lead data)
- View Full Details (navigates to `/leads/[id]`)

### 4. Filters
Filter bar above the board with:
- **Search** — by customer name, project type, or description
- **Assignee** — dropdown of team members, multi-select
- **Project type** — dropdown of service types (Concrete Patio, Driveway, Stamped, etc.)
- **Date range** — preset options: Today, This Week, This Month, Last 30 Days, Custom Range
- **Source** — filter by lead source (Google, Facebook, Vapi, Referral, Yard Sign, etc.)
- Active filters show as dismissible chips below the filter bar
- "Clear all" button when any filters are active

### 5. Sort Within Columns
Dropdown per column (or global toggle) to sort cards by:
- Dollar amount (highest first)
- Lead age (oldest first — default)
- Last activity (most recent first)
- Customer name (A-Z)

### 6. Bulk Actions
- Checkbox on each card (appears on hover desktop, always visible mobile)
- "Select all in column" option on column header
- Bulk action toolbar appears when 1+ cards selected:
  - Reassign to team member
  - Change status
  - Archive (soft delete)
  - Cancel selection

### 7. Inline Lead Creation
- "+ Add Lead" button at the top of the "New" column
- Opens a slide-over panel with minimal fields: Customer name, Phone, Project type, Source, Notes
- On save: creates customer + lead, card appears in New column instantly
- Full form still available at `/customers/new` for detailed entry

### 8. Pipeline Value Totals
- Each column header shows sum of quoted amounts for that stage
- Grand total bar at the top: "Pipeline Value: $XX,XXX across XX active leads"
- Excludes Completed and Lost from the grand total

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Monday morning pipeline review | Opens leads, scans for red dots (stale leads), sorts Quoted column by dollar amount to prioritize big deals |
| Jake | Daily follow-up round | Filters by his name as assignee, works through his New and Contacted leads, uses quick action panel to call and add notes |
| Evan | Weekly performance check | Filters by "This Week", sees how many new leads came in, how many moved to Quoted, how many booked |
| Jake | Quick lead entry | Gets a phone call, clicks "+ Add Lead" in the New column, enters name/phone/project type without leaving the board |
| Evan | Reassigning work | Jake's on vacation next week — selects all Jake's leads, bulk reassigns to Mike |
| Evan | Identifying bottleneck | Sees 8 leads stuck in Quoted with orange/red dots, realizes follow-up is falling behind, takes action |

## Data Sources
- Leads: Supabase `leads` table joined with `customers`
- Assignees: Supabase `team_members` table
- Activities: Supabase `activities` table (for age/staleness calculation)
- Real-time: Subscribe to Supabase realtime for new leads (Vapi webhook creates leads)

## Open Questions
- Should "Lost" leads auto-archive after 30 days?
- Should there be a "Won" celebration animation when a lead moves to Completed?
- Max leads per column before pagination/scroll becomes an issue?
