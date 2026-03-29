# Calendar Spec (`/calendar`)

## Purpose
The scheduling hub. Every site visit, pour day, and blocked-off afternoon lives here. Must make it obvious who's going where and when, prevent double-booking, and keep customers in the loop with automated confirmations. Syncs with Google Calendar so Evan's phone always has the real picture.

## Capabilities

### 1. Week View (Default)
- Hourly time slots from 7am to 6pm
- 7-day layout with day headers showing day name and date
- Today's column highlighted
- Events rendered as colored blocks positioned by start time and sized by duration
- Week navigation: Previous, Today, Next buttons
- Month/year label in header

### 2. Month View
- Toggle between Week and Month view
- Month view shows a traditional calendar grid
- Each day cell shows event count dot indicators (colored by type)
- Click a day to zoom into that day's week view
- Events listed as compact text within day cells (max 3 visible, "+2 more" overflow)

### 3. Create Event
- Click any empty time slot to open the new event form
- Pre-filled with the clicked date and time
- Event form fields:
  - **Title** — auto-generated from type + customer name, editable
  - **Type** — dropdown: Quote Visit, Pour Day, Cleanup, Delivery, Personal, Blocked
  - **Customer** — searchable dropdown (only for work events, hidden for Personal/Blocked)
  - **Phone** — auto-filled from customer record
  - **Address** — auto-filled from customer record, editable
  - **Service type** — auto-filled from customer/lead, editable
  - **Project description** — textarea
  - **Assigned to** — team member dropdown, multi-select for crew events
  - **Start time** — time picker
  - **End time** — time picker (default: start + 1 hour)
  - **Notes** — internal notes
  - **Send confirmation** — checkbox (default on for Quote Visit), triggers SMS to customer
- "Save" creates the event, "Save & Create Lead" also creates a lead for this customer if one doesn't exist

### 4. Drag to Reschedule
- Drag an event block to a different time slot or day
- Visual preview while dragging (ghost block at new position)
- On drop: updates start_time and end_time, preserving duration
- Confirmation toast: "Moved [event] to [new date/time]"
- If customer confirmation was sent: prompt "Resend confirmation to customer?"

### 5. Drag to Resize
- Drag the bottom edge of an event block to change duration
- Minimum duration: 30 minutes
- On release: updates end_time
- Visual indicator of new duration while dragging

### 6. Team Member Lanes
- Toggle: "By Day" (default, all events in one column per day) vs "By Team Member"
- Team member view:
  - One column per active team member
  - Day headers within each column
  - Shows who has availability and who's booked solid
  - Useful for assigning new events to the least-busy crew member
- Team members configurable: show/hide individual members via filter

### 7. Event Color Coding
- **Quote Visit** — blue (brand color)
- **Pour Day** — emerald/green (revenue day)
- **Cleanup** — amber/orange
- **Delivery** — purple
- **Personal** — gray
- **Blocked** — striped/hatched gray
- Color legend bar below the calendar header
- Colors consistent across week and month views

### 8. Availability Display
- Background shading on the calendar grid:
  - Available hours (from team member availability rules): white/clear
  - Unavailable hours: light gray striped background
- Per-team-member in lane view
- Prevents visual confusion about when someone can actually be scheduled
- Availability rules configured in Settings

### 9. Google Calendar Sync
- Two-way sync with Evan's Google Calendar
- Setup: OAuth flow to connect Google account (one-time in Settings)
- Sync behavior:
  - CRM events push to Google Calendar (with customer name, address, phone in description)
  - Google Calendar events pull into CRM as "Personal" type (read-only in CRM)
  - Changes in either system propagate within 5 minutes
- Sync indicator in calendar header: "Synced with Google Calendar ✓" or "Sync error"
- Events from Google show a small Google icon badge

### 10. Route Optimization
- When 2+ site visits exist on the same day:
  - "Optimize Route" button appears in the day header
  - Calculates optimal driving order based on customer addresses
  - Shows suggested order with estimated drive times between stops
  - "Apply" reorders the events on the calendar to match the route
  - "Open in Google Maps" generates a multi-stop Google Maps URL
- Uses Google Directions API or simple geocode distance calculation
- Most useful for days with 3+ quote visits across the county

### 11. SMS Confirmation
- When a Quote Visit event is created with "Send confirmation" checked:
  - Auto-sends SMS to customer phone number:
    - "Hi [Name], this is The Finishing Touch confirming your appointment on [Day, Date] at [Time]. We'll be coming to [Address]. Reply to reschedule. - Evan"
  - SMS sent via Twilio or Vapi SMS endpoint
- 24-hour reminder: auto-sends day-before reminder SMS
  - "Reminder: The Finishing Touch will be at [Address] tomorrow at [Time]. See you then!"
- Customer replies are logged as activities on the customer record (stretch goal)

### 12. Event Detail Modal
- Click an event to open detail modal:
  - All event info displayed
  - Customer phone: click-to-call
  - Customer address: click to open Google Maps
  - Edit button: opens edit form
  - Cancel event: with reason, optionally notifies customer
  - "Convert to Lead" if no associated lead exists
  - Activity log for this event (created, confirmation sent, reminder sent, etc.)

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Scheduling a quote visit | Customer calls, Evan clicks Tuesday at 10am, selects Quote Visit, picks the customer, saves — customer gets a confirmation text |
| Evan | Planning the week | Switches to team member lanes, sees Jake is open Wednesday but Mike is booked, assigns a new visit to Jake |
| Evan | Multi-stop Thursday | Has 4 quote visits on Thursday, clicks "Optimize Route", sees the best driving order, applies it, opens the route in Google Maps |
| Evan | Customer reschedules | Drags the event from Tuesday 10am to Thursday 2pm, gets prompted to resend confirmation, clicks yes |
| Evan | Checking his phone | Opens Google Calendar on his iPhone, sees all CRM events synced — knows exactly where he needs to be |
| Jake | Blocking personal time | Creates a Personal event for Friday afternoon doctor appointment, team sees he's unavailable |
| Evan | Rainy day adjustment | Sees pour days scheduled for Wednesday, checks weather (from dashboard), drags them to next week |

## Data Sources
- Events: Supabase `calendar_events` table
- Availability: Supabase `availability_rules` table
- Team members: Supabase `team_members` table
- Customers: Join with `customers` table for contact info
- Google Calendar: Google Calendar API (OAuth, two-way sync)
- Route optimization: Google Directions API
- SMS: Twilio API or Vapi SMS endpoint
- Activities: Log event actions to `activities` table

## Layout — Week View
```
┌──────────────────────────────────────────────────────────┐
│ Calendar    [◀ Prev] [Today] [Next ▶]   [Week] [Month]  │
│ March 2026                              [By Day|By Team] │
├──────┬────────┬────────┬────────┬────────┬────────┬──────┤
│      │  Mon   │  Tue   │  Wed   │  Thu   │  Fri   │ Sat  │
│      │  23    │  24    │  25*   │  26    │  27    │  28  │
├──────┼────────┼────────┼────────┼────────┼────────┼──────┤
│ 7 AM │        │        │        │        │        │      │
│ 8 AM │        │ ┌────┐ │        │        │        │      │
│ 9 AM │        │ │Qte │ │        │ ┌────┐ │        │      │
│10 AM │ ┌────┐ │ │Vist│ │        │ │Pour│ │        │      │
│11 AM │ │Qte │ │ └────┘ │        │ │Day │ │        │      │
│12 PM │ │Vist│ │        │        │ │    │ │        │      │
│ 1 PM │ └────┘ │        │ ┌────┐ │ │    │ │        │      │
│ 2 PM │        │        │ │Qte │ │ └────┘ │ ┌────┐ │      │
│ 3 PM │        │        │ │Vist│ │        │ │Pers│ │      │
│ 4 PM │        │        │ └────┘ │        │ └────┘ │      │
├──────┴────────┴────────┴────────┴────────┴────────┴──────┤
│ Legend: 🔵 Quote Visit  🟢 Pour Day  🟡 Cleanup          │
│         🟣 Delivery     ⚫ Personal   ░░ Blocked          │
│                                                           │
│ Thu 26: 4 site visits  [Optimize Route] [Open in Maps]   │
└──────────────────────────────────────────────────────────┘
```

## Open Questions
- Should SMS confirmations use Twilio directly or route through Vapi?
- Should Google Calendar sync be per-user or one shared calendar for the whole team?
- Should the calendar support recurring events (e.g., weekly maintenance visits)?
- Should cancelled events send a cancellation SMS to the customer automatically?
