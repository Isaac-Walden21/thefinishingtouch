# AI Phone Receptionist — The Finishing Touch LLC

## Overview

An AI-powered phone receptionist named "Jake" that answers inbound calls for The Finishing Touch LLC, qualifies leads, checks calendar availability, books quote appointments, creates leads in the CRM, and emails Evan a summary after every call. Built on Vapi + GPT-4o Realtime for the most natural-sounding voice available.

## System Architecture

Three components:

1. **Vapi Voice Agent** — Handles telephony, speech-to-text, LLM orchestration, text-to-speech. Configured with GPT-4o Realtime model and custom tools (function calls) that hit the CRM API.
2. **CRM Calendar Module** — New feature in the existing Next.js + Supabase CRM. Full event management UI with team availability rules. Exposes REST API endpoints for the voice agent.
3. **Lead + Email Pipeline** — Auto-creates CRM leads from call data. Sends email summaries to Evan via Resend (already in the project).

### Call Flow

There are two paths depending on whether the caller books an appointment:

**Happy path (appointment booked during call):**
```
Caller dials Vapi number
  → Vapi answers, GPT-4o Realtime streams as "Jake"
  → Jake qualifies the lead (service, address, name, phone, project details)
  → Jake calls check_availability tool → CRM API returns open slots
  → Jake offers times to caller → caller picks one
  → Jake calls book_appointment tool → CRM creates Customer + Lead + Event
  → Jake confirms and wraps up the call
  → Vapi end-of-call webhook fires → CRM attaches transcript/duration, sends email to Evan
```

**Incomplete path (no appointment booked):**
```
Caller dials Vapi number
  → Vapi answers as Jake
  → Caller hangs up early, asks out-of-scope question, or declines to schedule
  → If out-of-scope: Jake calls send_message tool → CRM creates Customer + Lead (status: "new")
  → Vapi end-of-call webhook fires → CRM checks if a lead was already created during the call
    → If yes: attaches transcript/duration, sends email summary
    → If no (caller hung up before any tool call): creates lead from Vapi call metadata if available, sends "Missed Lead" email
```

### Webhook Processing Logic

The `POST /api/vapi/webhook` endpoint always fires after every call. Its responsibilities:

1. **Check for existing lead** — Look up by `vapi_call_id` on the lead record (set during tool calls). If found, this is a completed call — attach transcript URL and call duration, then send the appropriate email.
2. **Create missed lead if needed** — If no lead exists for this call, create one from Vapi's call metadata (caller phone number, call duration). Send a "Missed Lead" email with whatever info is available.
3. **Send email summary** — Always sends an email. Type depends on what happened: qualified lead, missed lead, firewood order, or callback request.

Vapi's end-of-call webhook payload includes: `call_id`, `phone_number`, `duration`, `transcript`, `transcript_url`, `ended_reason`, and metadata from any tool calls made during the conversation.

## Voice Agent — "Jake"

### Persona

- **Name:** Jake
- **Role:** Front office coordinator at The Finishing Touch
- **Tone:** Laid back, helpful, conversational. Small-town Indiana friendly — not corporate or scripted.
- **Speech patterns:** Uses "yeah" not "yes," "we'll get you taken care of" not "we'll schedule your appointment." Natural filler like "let me check on that real quick," "alright so," "perfect."
- **Domain knowledge:** Understands the 6 service types, can discuss basics (stamped vs broom finish, common post frame sizes, what curbing looks like). Enough to hold a real conversation, not just collect form fields.
- **If asked "are you an AI?":** Honest — "Yeah I'm actually an AI assistant — but I can get you set up with a quote just the same."
- **First message:** "Hey, thanks for calling The Finishing Touch! How can I help you today?"

**Note:** The existing demo data includes a team member named "Jake Henderson." The AI agent persona is separate from CRM team member records. The `created_by` field on calendar events and leads distinguishes "agent" from "manual" to prevent ambiguity.

### Information Collected

1. **Service type** — One of: concrete patio, concrete driveway, stamped concrete, decorative curbing, post frame building, landscaping, firewood delivery
2. **Project description** — What they want done, any specifics or preferences
3. **Property address** — Where the work would be performed
4. **Customer name** — Full name
5. **Customer phone** — Callback number (may already have from caller ID)
6. **Appointment** — Offers available slots, books the one they choose

### Guardrails

- **Pricing questions:** "Every project is a little different — that's why we like to come out and take a look first. Let me get you set up with a free quote visit."
- **Out-of-scope requests** (complaints, existing project status, billing): "Let me have Evan give you a call back on that." Captures the message via `send_message` tool.
- **Firewood orders:** No quote visit needed. Agent captures order details (quantity, delivery address) and creates a lead via `send_message` with service_type "Firewood Delivery" — no calendar booking.
- **Service area:** Greentown, IN and surrounding Howard County area. If caller is clearly out of range, Jake lets them know politely.
- **No available slots:** "Looks like we're pretty booked up this week — want me to check next week?" If still no slots, "I'll have Evan give you a call to work something out." Falls back to `send_message`.
- **Tool call failures:** If any API call fails, Jake says "I'm having a little trouble pulling that up — let me take your info and have Evan call you right back." Falls back to `send_message`.

### Vapi Function Calls (Tools)

Three tools the agent can invoke mid-conversation:

#### `check_availability`
- **Purpose:** Find open appointment slots
- **Parameters:** `date_range_start` (ISO date), `date_range_end` (ISO date)
- **Returns:** Array of available time slots with rep name
- **Hits:** `GET /api/calendar/availability`

#### `book_appointment`
- **Purpose:** Create a calendar event, customer record, and CRM lead
- **Parameters:** `datetime`, `customer_name`, `customer_phone`, `customer_address`, `service_type`, `project_description`
- **Returns:** Confirmation with date/time and assigned rep
- **Hits:** `POST /api/calendar/events`
- **Side effects:** Creates Customer (or finds existing by phone number), creates Lead (status: "booked"), creates calendar event, stores `vapi_call_id` on the lead

#### `send_message`
- **Purpose:** For out-of-scope requests, firewood orders, or fallback when booking fails
- **Parameters:** `customer_name`, `customer_phone`, `message`, `service_type` (optional)
- **Returns:** Confirmation
- **Hits:** `POST /api/leads/from-call`
- **Side effects:** Creates Customer (or finds existing by phone number), creates Lead (status: "new"), stores `vapi_call_id` on the lead

## CRM Calendar Module

### UI — New `/calendar` Route

Full calendar interface added to the CRM sidebar navigation:

- **Views:** Weekly and monthly, toggle between them
- **Drag and drop:** Create events by clicking/dragging on time slots, move events by dragging
- **Event editing:** Click event to open detail modal (edit time, rep, customer info, notes)
- **Team member filter:** Toggle visibility per rep (color coded)
- **Today indicator:** Current time line on weekly view
- **Library:** Use `@schedule-x/react` for the calendar grid — supports week/month views, drag-and-drop, and event rendering out of the box. Style to match the CRM's existing design system.

### Team Members

Extend the existing `TeamMember` type in `src/lib/types.ts` with new fields rather than creating a parallel table:

| New Field | Type | Notes |
|-----------|------|-------|
| phone | text | nullable |
| color | text | Hex color for calendar display |
| notification_email | text | nullable, defaults to email. Where lead summaries are sent. |
| is_active | boolean | default true |

Existing fields (`id`, `name`, `email`, `role`, `created_at`) stay as-is. The `TeamRole` type gets a new value: `"sales_rep"`.

**Current team:** Evan Ellis (only active rep for now). Data model supports adding John Horner, Tanner Moyers, and future hires.

### Availability Rules

Per team member, per day of week:
- Day of week (Mon-Sun)
- Start time, end time (stored as time without timezone — interpreted as America/Indiana/Indianapolis)
- Enabled/disabled toggle

Example: Evan is available Mon-Fri 8:00 AM - 5:00 PM, off weekends.

Blocked time (vacations, personal) handled by creating "blocked" type events on the calendar.

### Timezone

All business logic uses **America/Indiana/Indianapolis** (Eastern, no DST observance). This is explicitly set:
- `availability_rules.start_time` and `end_time` are naive `time` values interpreted as local business time
- `calendar_events.start_time` and `end_time` are `timestamptz` stored in UTC
- The availability API converts between local time and UTC when computing open slots
- Vapi sends/receives times in UTC; the API handles conversion

### Event Types

- **quote_visit** — Booked by the AI agent or manually. Has customer info attached.
- **blocked** — Time blocked off. Agent cannot book into these slots.
- **personal** — General calendar events (meetings, reminders, etc.)

### Event Status

Events have a `status` column for lifecycle tracking:
- **scheduled** — Active, on the calendar (default)
- **completed** — Quote visit happened
- **cancelled** — Cancelled but preserved for audit trail
- **no_show** — Customer didn't show up

### Appointment Duration

Default: 1 hour for quote visits. The agent always books 1-hour slots. Manual events created in the CRM UI can have custom durations.

### Color Coding

- Each team member gets a distinct color
- Event types have subtle visual differentiation (quote visits show customer name, blocked time is grayed out, cancelled events are dimmed)

### API Endpoints

#### `GET /api/calendar/availability`
- **Query params:** `start` (ISO date), `end` (ISO date), `team_member_id` (optional)
- **Logic:** Takes availability rules for the business timezone, subtracts existing events (status: scheduled), returns open 1-hour slots. Converts to UTC for response.
- **Returns:** `{ slots: [{ start, end, team_member_id, team_member_name }] }`
- **Auth:** API key (x-api-key header) for Vapi, session auth for CRM users
- **Rate limit:** 60 requests/minute per API key

#### `POST /api/calendar/events`
- **Body:** `{ team_member_id, type, title, start, end, customer_name, customer_phone, customer_address, service_type, project_description, created_by, vapi_call_id }`
- **Side effects:**
  1. Finds or creates Customer by phone number (upsert on phone match)
  2. Creates Lead with status "booked", linked to customer
  3. Creates calendar event linked to lead
  4. If `created_by` is "agent", stores `vapi_call_id` on the lead for webhook correlation
- **Returns:** Created event object with lead_id
- **Auth:** API key or session auth
- **Rate limit:** 30 requests/minute per API key

#### `POST /api/leads/from-call`
- **Body:** `{ customer_name, customer_phone, message, service_type, vapi_call_id }`
- **Side effects:**
  1. Finds or creates Customer by phone number
  2. Creates Lead with status "new", project_description set to message
  3. Stores `vapi_call_id` on lead
- **Returns:** Created lead object
- **Auth:** API key
- **Rate limit:** 30 requests/minute per API key

#### `POST /api/vapi/webhook`
- **Body:** Vapi end-of-call webhook payload
- **Logic:**
  1. Validate webhook signature or API key
  2. Extract `call_id`, `transcript_url`, `duration`, `phone_number`
  3. Find lead by `vapi_call_id` matching the call_id
  4. If lead found: update with transcript URL and call duration, send appropriate email
  5. If no lead found: create Customer + Lead from phone number, send "Missed Lead" email
  6. Send email via Resend
- **Auth:** Vapi webhook signature or API key

#### `GET /api/calendar/events`
- **Query params:** `start`, `end`, `team_member_id` (optional)
- **Returns:** Array of events for the CRM calendar UI (excludes cancelled by default)
- **Auth:** Session auth

#### `PUT /api/calendar/events/[id]`
- **Body:** Partial event update (reschedule, edit details, change status)
- **Auth:** Session auth

#### `DELETE /api/calendar/events/[id]`
- **Sets status to "cancelled"** — never hard deletes. Preserves audit trail.
- **Auth:** Session auth

### API Authentication

- **Vapi calls (agent tools + webhook):** Authenticated via API key in `VAPI_API_KEY` env var. Middleware checks `x-api-key` header.
- **CRM user calls:** Standard Supabase session auth (existing pattern in the app).
- **Rate limiting:** Applied to all Vapi-facing endpoints to prevent abuse from misconfiguration or leaked keys.

## Database Schema (Supabase)

### Extend `team_members` (existing table)
| New Column | Type | Notes |
|------------|------|-------|
| phone | text | nullable |
| color | text | Hex color for calendar, default '#0085FF' |
| notification_email | text | nullable, falls back to email |
| is_active | boolean | default true |

### `availability_rules` (new table)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| team_member_id | uuid | FK → team_members |
| day_of_week | int | 0=Sun, 6=Sat |
| start_time | time | Local business time (America/Indiana/Indianapolis) |
| end_time | time | Local business time |
| is_enabled | boolean | default true |

**RLS:** Read access for authenticated users. Write access for admin/manager roles only.

### `calendar_events` (new table)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| team_member_id | uuid | FK → team_members |
| type | text | quote_visit, blocked, personal |
| status | text | scheduled, completed, cancelled, no_show. Default: scheduled |
| title | text | |
| description | text | nullable |
| start_time | timestamptz | UTC |
| end_time | timestamptz | UTC |
| customer_name | text | nullable (only for quote_visit) |
| customer_phone | text | nullable |
| customer_address | text | nullable |
| service_type | text | nullable |
| project_description | text | nullable |
| created_by | text | agent, manual |
| lead_id | uuid | nullable, FK → leads |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:** Read access for authenticated users. Write access for authenticated users (manual events) and service role (agent-created events via API routes).

### Extend `leads` (existing table)
| New Column | Type | Notes |
|------------|------|-------|
| vapi_call_id | text | nullable, for webhook correlation |
| call_transcript_url | text | nullable, set by webhook |
| call_duration_seconds | int | nullable, set by webhook |

### Customer Deduplication

When the agent creates a customer, the API upserts on phone number:
- If a customer with matching phone exists, use that customer_id for the new lead
- If no match, create a new customer record
- This prevents duplicate customers from repeat callers

## Email Summary

### Trigger
Vapi end-of-call webhook fires → `POST /api/vapi/webhook` processes and sends email via Resend.

### Qualified Lead Email (appointment booked)
- **To:** Evan's notification_email from team_members (evan@thefinishingtouchllc.com)
- **Subject:** `New Quote Request — [Customer Name] — [Service Type]`
- **Body:**
  - Customer name, phone number
  - Property address
  - Service type requested
  - Project description
  - Scheduled quote visit: date, time, assigned rep
  - Call duration
  - Link to full transcript (from Vapi)
  - Link to lead in CRM

### Missed Lead Email (no appointment)
- **To:** evan@thefinishingtouchllc.com
- **Subject:** `Missed Lead — [Customer Name or "Unknown Caller"]`
- **Body:** Whatever info was captured + reason (hung up, declined to schedule, out of service area)

### Firewood Order Email
- **To:** evan@thefinishingtouchllc.com
- **Subject:** `Firewood Order — [Customer Name]`
- **Body:** Customer info, quantity, delivery address, any notes

### Callback Request Email
- **To:** evan@thefinishingtouchllc.com
- **Subject:** `Callback Requested — [Customer Name]`
- **Body:** Customer info, message/question they had

## Technology Choices

| Component | Technology | Reason |
|-----------|-----------|--------|
| Voice AI platform | Vapi | Best developer experience, supports GPT-4o Realtime, function calling, webhooks |
| LLM | GPT-4o Realtime | Most natural-sounding voice model available |
| Calendar UI | @schedule-x/react | Week/month views, drag-and-drop, event rendering. Style to match existing CRM. |
| Database | Supabase (existing) | Already the project's database |
| Email | Resend (existing) | Already configured in the project |
| API auth for Vapi | API key middleware | Simple, secure, standard pattern |

## Future Considerations (Not in v1)

- **Multi-rep routing:** Availability-first algorithm — whoever has the soonest open slot gets the appointment. Data model supports this now, logic added when team grows.
- **Territory/service assignment:** Certain reps handle certain services or zip codes.
- **SMS confirmation:** Text the customer a confirmation after booking.
- **Calendar sync:** Optional Google Calendar or iCal export for reps who want it on their phone.
- **Call analytics dashboard:** Volume, conversion rate, average call duration, common service requests.
- **Transcript storage:** Store full transcripts in Supabase storage if Vapi transcript URLs expire.
