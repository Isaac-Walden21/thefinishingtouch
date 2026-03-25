# AI Phone Receptionist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI phone receptionist ("Jake") that answers calls via Vapi, qualifies leads, books quote appointments on a CRM calendar, and emails Evan a summary.

**Architecture:** Vapi + GPT-4o Realtime handles telephony and voice. The existing Next.js + Supabase CRM gets a new calendar module with team availability, REST API endpoints for the voice agent's tool calls, and email notifications via Resend. All new tables use the existing Supabase patterns (UUID PKs, timestamptz, RLS).

**Tech Stack:** Next.js 16, Supabase, Vapi, GPT-4o Realtime, Resend, Zod

**Spec:** `docs/superpowers/specs/2026-03-24-ai-phone-receptionist-design.md`

---

## File Structure

### New Files
```
src/lib/api-auth.ts                          — API key validation middleware for Vapi endpoints
src/lib/timezone.ts                          — Timezone conversion helpers (local ↔ UTC)
src/lib/availability.ts                      — Slot computation logic (rules - events = open slots)
src/lib/email-templates.ts                   — Resend email templates (qualified, missed, firewood, callback)
src/lib/send-email.ts                        — Resend send wrapper
src/lib/customer-upsert.ts                   — Find-or-create customer by phone number
src/app/(crm)/api/calendar/availability/route.ts
src/app/(crm)/api/calendar/events/route.ts
src/app/(crm)/api/calendar/events/[id]/route.ts
src/app/(crm)/api/leads/from-call/route.ts
src/app/(crm)/api/vapi/webhook/route.ts
src/app/(crm)/calendar/page.tsx              — Calendar UI page
src/components/calendar/CalendarView.tsx      — Main calendar wrapper
src/components/calendar/EventModal.tsx        — Create/edit event modal
supabase/migrations/003_calendar_tables.sql  — New tables + schema changes
```

### Modified Files
```
src/lib/types.ts                             — New types: CalendarEvent, AvailabilityRule, extended TeamMember/Lead
src/lib/demo-data.ts                         — Demo calendar events + availability rules for Evan
src/components/Sidebar.tsx                   — Add Calendar nav item
package.json                                 — No new deps needed (calendar built with CSS grid)
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/003_calendar_tables.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Ensure update_updated_at function exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Extend team_members
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#0085FF',
  ADD COLUMN IF NOT EXISTS notification_email text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Extend team_role enum
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'sales_rep';

-- Extend leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS vapi_call_id text,
  ADD COLUMN IF NOT EXISTS call_transcript_url text,
  ADD COLUMN IF NOT EXISTS call_duration_seconds int;

-- Create availability_rules
CREATE TABLE availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_enabled boolean DEFAULT true,
  UNIQUE (team_member_id, day_of_week)
);

CREATE INDEX idx_availability_rules_team ON availability_rules(team_member_id);

-- Create calendar_events
CREATE TYPE event_type AS ENUM ('quote_visit', 'blocked', 'personal');
CREATE TYPE event_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  status event_status NOT NULL DEFAULT 'scheduled',
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  customer_name text,
  customer_phone text,
  customer_address text,
  service_type text,
  project_description text,
  created_by text NOT NULL DEFAULT 'manual',
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_calendar_events_team ON calendar_events(team_member_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);

-- Auto-update updated_at
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for vapi_call_id lookups on leads
CREATE INDEX idx_leads_vapi_call ON leads(vapi_call_id) WHERE vapi_call_id IS NOT NULL;

-- RLS for availability_rules
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read availability" ON availability_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage availability" ON availability_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read events" ON calendar_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage events" ON calendar_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Evan's availability (Mon-Fri 8am-5pm)
-- This requires Evan's team_member_id; run after inserting Evan into team_members
-- INSERT INTO availability_rules (team_member_id, day_of_week, start_time, end_time)
-- SELECT id, d, '08:00', '17:00' FROM team_members, generate_series(1, 5) AS d WHERE name = 'Evan Ellis';
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase migration up` or apply via Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_calendar_tables.sql
git commit -m "feat: add calendar_events, availability_rules tables and extend team_members/leads"
```

---

## Task 2: TypeScript Types + Shared Utilities

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/api-auth.ts`
- Create: `src/lib/timezone.ts`
- Create: `src/lib/customer-upsert.ts`

- [ ] **Step 1: Add new types to types.ts**

Add after the existing `Lead` interface:

```typescript
// Calendar & Availability
export type EventType = "quote_visit" | "blocked" | "personal";
export type EventStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface AvailabilityRule {
  id: string;
  team_member_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  is_enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  team_member_id: string;
  type: EventType;
  status: EventStatus;
  title: string;
  description: string | null;
  start_time: string; // ISO 8601 UTC
  end_time: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  service_type: string | null;
  project_description: string | null;
  created_by: "agent" | "manual";
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  team_member?: TeamMember;
}

export interface TimeSlot {
  start: string; // ISO 8601 UTC
  end: string;
  team_member_id: string;
  team_member_name: string;
}
```

Update existing `TeamRole`:
```typescript
export type TeamRole = "admin" | "manager" | "crew" | "sales_rep";
```

Update existing `TeamMember` interface — add:
```typescript
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  phone: string | null;
  color: string;
  notification_email: string | null;
  is_active: boolean;
  created_at: string;
}
```

Update existing `Lead` interface — add:
```typescript
export interface Lead {
  id: string;
  customer_id: string;
  status: LeadStatus;
  quoted_amount: number | null;
  project_type: string | null;
  project_description: string | null;
  assigned_to: string | null;
  vapi_call_id: string | null;
  call_transcript_url: string | null;
  call_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}
```

- [ ] **Step 2: Create API auth middleware**

```typescript
// src/lib/api-auth.ts
import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
// Note: In-memory rate limiting. On Vercel serverless, each cold start resets the Map.
// Acceptable for v1. For production, use Upstash Redis or similar.
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expected = process.env.VAPI_API_KEY;
  if (!expected) return false;
  return apiKey === expected;
}

export function rateLimit(
  key: string,
  maxRequests: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function rateLimitedResponse() {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

- [ ] **Step 3: Create timezone helpers**

```typescript
// src/lib/timezone.ts
const BUSINESS_TZ = "America/Indiana/Indianapolis";

/**
 * Convert a local HH:MM time + date to a UTC ISO string.
 * Treats the input as being in the business timezone (America/Indiana/Indianapolis).
 */
export function localTimeToUTC(date: string, time: string): string {
  // date = "2026-03-25", time = "08:00"
  // Parse the naive datetime, then compute the TZ offset to get UTC
  const naive = new Date(`${date}T${time}:00`);
  const utcStr = naive.toLocaleString("en-US", { timeZone: "UTC" });
  const localStr = naive.toLocaleString("en-US", { timeZone: BUSINESS_TZ });
  const offset = new Date(utcStr).getTime() - new Date(localStr).getTime();
  return new Date(naive.getTime() + offset).toISOString();
}

/** Format a UTC ISO string to local time display */
export function utcToLocalDisplay(utcStr: string): string {
  return new Date(utcStr).toLocaleString("en-US", {
    timeZone: BUSINESS_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Get the local date string (YYYY-MM-DD) for a UTC timestamp */
export function utcToLocalDate(utcStr: string): string {
  return new Date(utcStr).toLocaleDateString("en-CA", {
    timeZone: BUSINESS_TZ,
  });
}

export { BUSINESS_TZ };
```

- [ ] **Step 4: Create customer upsert helper**

```typescript
// src/lib/customer-upsert.ts
import { supabase } from "./supabase";

interface CustomerInput {
  name: string;
  phone: string;
  address?: string;
  service_type?: string;
}

/**
 * Find existing customer by phone number, or create a new one.
 * Returns the customer ID.
 */
export async function findOrCreateCustomer(
  input: CustomerInput
): Promise<string> {
  // Try to find by phone
  if (input.phone) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", input.phone)
      .limit(1)
      .single();

    if (existing) return existing.id;
  }

  // Create new customer
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      phone: input.phone,
      address: input.address ?? null,
      service_type: input.service_type ?? null,
      source: "phone_agent",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return data.id;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/api-auth.ts src/lib/timezone.ts src/lib/customer-upsert.ts
git commit -m "feat: add calendar types, API auth, timezone helpers, customer upsert"
```

---

## Task 3: Availability Computation Logic

**Files:**
- Create: `src/lib/availability.ts`

- [ ] **Step 1: Write the availability slot calculator**

This is the core algorithm: take availability rules, subtract existing events, return open 1-hour slots.

```typescript
// src/lib/availability.ts
import { supabase } from "./supabase";
import type { AvailabilityRule, CalendarEvent, TimeSlot } from "./types";
import { localTimeToUTC } from "./timezone";

const BUSINESS_TZ = "America/Indiana/Indianapolis";
const SLOT_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get available 1-hour slots for a date range.
 * Computes from availability rules minus existing events.
 */
export async function getAvailableSlots(
  startDate: string, // YYYY-MM-DD
  endDate: string,
  teamMemberId?: string
): Promise<TimeSlot[]> {
  // 1. Fetch availability rules
  let rulesQuery = supabase
    .from("availability_rules")
    .select("*")
    .eq("is_enabled", true);

  if (teamMemberId) {
    rulesQuery = rulesQuery.eq("team_member_id", teamMemberId);
  }

  const { data: rules, error: rulesError } = await rulesQuery;
  if (rulesError) throw new Error(`Failed to fetch rules: ${rulesError.message}`);
  if (!rules || rules.length === 0) return [];

  // 2. Fetch team members for names
  const teamMemberIds = [...new Set(rules.map((r: AvailabilityRule) => r.team_member_id))];
  const { data: members } = await supabase
    .from("team_members")
    .select("id, name")
    .in("id", teamMemberIds)
    .eq("is_active", true);

  const memberMap = new Map((members ?? []).map((m: { id: string; name: string }) => [m.id, m.name]));

  // 3. Fetch existing events in range (only scheduled ones block availability)
  const rangeStart = localTimeToUTC(startDate, "00:00");
  const rangeEnd = localTimeToUTC(endDate, "23:59");

  let eventsQuery = supabase
    .from("calendar_events")
    .select("team_member_id, start_time, end_time")
    .eq("status", "scheduled")
    .gte("start_time", rangeStart)
    .lte("end_time", rangeEnd);

  if (teamMemberId) {
    eventsQuery = eventsQuery.eq("team_member_id", teamMemberId);
  }

  const { data: events } = await eventsQuery;
  const bookedSlots = (events ?? []) as Pick<CalendarEvent, "team_member_id" | "start_time" | "end_time">[];

  // 4. Generate slots from rules
  const slots: TimeSlot[] = [];
  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();

    // Find matching rules for this day
    const dayRules = rules.filter(
      (r: AvailabilityRule) => r.day_of_week === dayOfWeek
    );

    for (const rule of dayRules) {
      const memberName = memberMap.get(rule.team_member_id);
      if (!memberName) continue;

      // Generate 1-hour slots within the rule window
      const ruleStartUTC = localTimeToUTC(dateStr, rule.start_time);
      const ruleEndUTC = localTimeToUTC(dateStr, rule.end_time);
      let slotStart = new Date(ruleStartUTC);
      const ruleEndDate = new Date(ruleEndUTC);

      while (slotStart.getTime() + SLOT_DURATION_MS <= ruleEndDate.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MS);

        // Check if slot overlaps with any existing event
        const isBooked = bookedSlots.some(
          (evt) =>
            evt.team_member_id === rule.team_member_id &&
            new Date(evt.start_time) < slotEnd &&
            new Date(evt.end_time) > slotStart
        );

        // Only return future slots
        if (!isBooked && slotStart > new Date()) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            team_member_id: rule.team_member_id,
            team_member_name: memberName,
          });
        }

        slotStart = slotEnd;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/availability.ts
git commit -m "feat: add availability slot computation (rules minus events)"
```

---

## Task 4: Calendar API Endpoints

**Files:**
- Create: `src/app/(crm)/api/calendar/availability/route.ts`
- Create: `src/app/(crm)/api/calendar/events/route.ts`
- Create: `src/app/(crm)/api/calendar/events/[id]/route.ts`

- [ ] **Step 1: GET /api/calendar/availability**

```typescript
// src/app/(crm)/api/calendar/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, rateLimit, unauthorizedResponse, rateLimitedResponse } from "@/lib/api-auth";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  // Auth: API key or session
  const isApiKey = validateApiKey(request);
  // TODO: check Supabase session if not API key
  if (!isApiKey) {
    // For now, allow unauthenticated for CRM users (demo mode)
    // In production, check session auth here
  }

  if (isApiKey) {
    const rl = rateLimit("availability", 60);
    if (!rl.allowed) return rateLimitedResponse();
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const teamMemberId = searchParams.get("team_member_id") ?? undefined;

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query params required" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(start, end, teamMemberId);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "Failed to compute availability" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: GET + POST /api/calendar/events**

```typescript
// src/app/(crm)/api/calendar/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, rateLimit, rateLimitedResponse } from "@/lib/api-auth";
import { findOrCreateCustomer } from "@/lib/customer-upsert";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const teamMemberId = searchParams.get("team_member_id");

  let query = supabase
    .from("calendar_events")
    .select("*, team_member:team_members(id, name, color)")
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  if (start) query = query.gte("start_time", start);
  if (end) query = query.lte("end_time", end);
  if (teamMemberId) query = query.eq("team_member_id", teamMemberId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const isApiKey = validateApiKey(request);
  if (isApiKey) {
    const rl = rateLimit("events-create", 30);
    if (!rl.allowed) return rateLimitedResponse();
  }

  const body = await request.json();
  const {
    team_member_id,
    type = "quote_visit",
    title,
    start,
    end,
    datetime,  // Vapi sends this instead of start/end
    customer_name,
    customer_phone,
    customer_address,
    service_type,
    project_description,
    created_by = "manual",
    vapi_call_id,
  } = body;

  // Support both start/end (CRM UI) and datetime (Vapi agent — 1hr slot)
  const eventStart = start ?? datetime;
  const eventEnd = end ?? (datetime ? new Date(new Date(datetime).getTime() + 3600000).toISOString() : undefined);

  if (!eventStart || !eventEnd) {
    return NextResponse.json(
      { error: "start/end or datetime is required" },
      { status: 400 }
    );
  }

  // Auto-assign team member if not provided (agent calls don't pass team_member_id)
  let assignedTeamMemberId = team_member_id;
  if (!assignedTeamMemberId) {
    const { data: slot } = await supabase
      .from("availability_rules")
      .select("team_member_id")
      .eq("is_enabled", true)
      .limit(1)
      .single();
    assignedTeamMemberId = slot?.team_member_id;
  }

  if (!assignedTeamMemberId) {
    return NextResponse.json(
      { error: "No available team member found" },
      { status: 400 }
    );
  }

  try {
    let leadId: string | null = null;

    // If this is a quote_visit with customer info, create customer + lead
    if (type === "quote_visit" && customer_name && customer_phone) {
      const customerId = await findOrCreateCustomer({
        name: customer_name,
        phone: customer_phone,
        address: customer_address,
        service_type,
      });

      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          customer_id: customerId,
          status: "booked",
          project_type: service_type,
          project_description,
          assigned_to: assignedTeamMemberId,
          vapi_call_id: vapi_call_id ?? null,
        })
        .select("id")
        .single();

      if (leadError) throw new Error(`Lead creation failed: ${leadError.message}`);
      leadId = lead.id;
    }

    // Create calendar event
    const eventTitle = title ?? (customer_name ? `Quote: ${customer_name}` : "Blocked Time");
    const { data: event, error: eventError } = await supabase
      .from("calendar_events")
      .insert({
        team_member_id: assignedTeamMemberId,
        type,
        title: eventTitle,
        start_time: eventStart,
        end_time: eventEnd,
        customer_name: customer_name ?? null,
        customer_phone: customer_phone ?? null,
        customer_address: customer_address ?? null,
        service_type: service_type ?? null,
        project_description: project_description ?? null,
        created_by,
        lead_id: leadId,
      })
      .select("*")
      .single();

    if (eventError) throw new Error(`Event creation failed: ${eventError.message}`);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: PUT + DELETE /api/calendar/events/[id]**

```typescript
// src/app/(crm)/api/calendar/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Whitelist allowed update fields — never pass raw body to Supabase
  const { title, description, start_time, end_time, status, team_member_id,
    customer_name, customer_phone, customer_address, service_type, project_description } = body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (start_time !== undefined) updates.start_time = start_time;
  if (end_time !== undefined) updates.end_time = end_time;
  if (status !== undefined) updates.status = status;
  if (team_member_id !== undefined) updates.team_member_id = team_member_id;
  if (customer_name !== undefined) updates.customer_name = customer_name;
  if (customer_phone !== undefined) updates.customer_phone = customer_phone;
  if (customer_address !== undefined) updates.customer_address = customer_address;
  if (service_type !== undefined) updates.service_type = service_type;
  if (project_description !== undefined) updates.project_description = project_description;

  const { data, error } = await supabase
    .from("calendar_events")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Soft delete — set status to cancelled
  const { data, error } = await supabase
    .from("calendar_events")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(crm)/api/calendar/
git commit -m "feat: add calendar API endpoints (availability, events CRUD)"
```

---

## Task 5: Lead-from-Call + Vapi Webhook Endpoints

**Files:**
- Create: `src/app/(crm)/api/leads/from-call/route.ts`
- Create: `src/app/(crm)/api/vapi/webhook/route.ts`
- Create: `src/lib/send-email.ts`
- Create: `src/lib/email-templates.ts`

- [ ] **Step 1: Create email templates**

```typescript
// src/lib/email-templates.ts
import { utcToLocalDisplay } from "./timezone";

interface QualifiedLeadData {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  service_type: string;
  project_description: string;
  appointment_time: string; // UTC ISO
  assigned_rep: string;
  call_duration_seconds: number;
  transcript_url: string | null;
  lead_id: string;
  crm_base_url: string;
}

interface MissedLeadData {
  customer_phone: string | null;
  call_duration_seconds: number;
  ended_reason: string;
}

interface CallbackData {
  customer_name: string;
  customer_phone: string;
  message: string;
  service_type: string | null;
}

interface FirewoodData {
  customer_name: string;
  customer_phone: string;
  message: string;
}

export function qualifiedLeadEmail(data: QualifiedLeadData) {
  return {
    subject: `New Quote Request — ${data.customer_name} — ${data.service_type}`,
    html: `
      <h2>New Quote Visit Scheduled</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Customer</td><td style="padding:8px 0;font-weight:600;">${data.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Address</td><td style="padding:8px 0;">${data.customer_address}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Service</td><td style="padding:8px 0;">${data.service_type}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Description</td><td style="padding:8px 0;">${data.project_description}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Appointment</td><td style="padding:8px 0;font-weight:600;">${utcToLocalDisplay(data.appointment_time)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Assigned To</td><td style="padding:8px 0;">${data.assigned_rep}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Call Duration</td><td style="padding:8px 0;">${Math.round(data.call_duration_seconds / 60)} min</td></tr>
      </table>
      ${data.transcript_url ? `<p style="margin-top:16px;"><a href="${data.transcript_url}">View Full Transcript</a></p>` : ""}
      <p style="margin-top:16px;"><a href="${data.crm_base_url}/leads/${data.lead_id}">View in CRM</a></p>
    `,
  };
}

export function missedLeadEmail(data: MissedLeadData) {
  return {
    subject: `Missed Lead — ${data.customer_phone ?? "Unknown Caller"}`,
    html: `
      <h2>Missed Call</h2>
      <p>A caller did not complete the booking process.</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${data.customer_phone ?? "Unknown"}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Call Duration</td><td style="padding:8px 0;">${Math.round(data.call_duration_seconds / 60)} min</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Reason</td><td style="padding:8px 0;">${data.ended_reason}</td></tr>
      </table>
    `,
  };
}

export function callbackEmail(data: CallbackData) {
  return {
    subject: `Callback Requested — ${data.customer_name}`,
    html: `
      <h2>Callback Requested</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Customer</td><td style="padding:8px 0;font-weight:600;">${data.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></td></tr>
        ${data.service_type ? `<tr><td style="padding:8px 0;color:#666;">Service</td><td style="padding:8px 0;">${data.service_type}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#666;">Message</td><td style="padding:8px 0;">${data.message}</td></tr>
      </table>
    `,
  };
}

export function firewoodEmail(data: FirewoodData) {
  return {
    subject: `Firewood Order — ${data.customer_name}`,
    html: `
      <h2>Firewood Order</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Customer</td><td style="padding:8px 0;font-weight:600;">${data.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Details</td><td style="padding:8px 0;">${data.message}</td></tr>
      </table>
    `,
  };
}
```

- [ ] **Step 2: Create Resend send wrapper**

```typescript
// src/lib/send-email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "The Finishing Touch <noreply@thefinishingtouchllc.com>";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEMO] Would send email to ${to}: ${subject}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

- [ ] **Step 3: POST /api/leads/from-call**

```typescript
// src/app/(crm)/api/leads/from-call/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, rateLimit, unauthorizedResponse, rateLimitedResponse } from "@/lib/api-auth";
import { findOrCreateCustomer } from "@/lib/customer-upsert";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const rl = rateLimit("leads-from-call", 30);
  if (!rl.allowed) return rateLimitedResponse();

  const body = await request.json();
  const { customer_name, customer_phone, message, service_type, vapi_call_id } = body;

  if (!customer_name || !customer_phone) {
    return NextResponse.json(
      { error: "customer_name and customer_phone are required" },
      { status: 400 }
    );
  }

  try {
    const customerId = await findOrCreateCustomer({
      name: customer_name,
      phone: customer_phone,
      service_type,
    });

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        customer_id: customerId,
        status: "new",
        project_type: service_type ?? null,
        project_description: message ?? null,
        vapi_call_id: vapi_call_id ?? null,
      })
      .select("*")
      .single();

    if (error) throw new Error(`Lead creation failed: ${error.message}`);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Lead from call error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lead" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: POST /api/vapi/webhook**

```typescript
// src/app/(crm)/api/vapi/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth";
import { findOrCreateCustomer } from "@/lib/customer-upsert";
import { sendEmail } from "@/lib/send-email";
import {
  qualifiedLeadEmail,
  missedLeadEmail,
  callbackEmail,
  firewoodEmail,
} from "@/lib/email-templates";

const DEFAULT_NOTIFICATION_EMAIL = "evan@thefinishingtouchllc.com";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const body = await request.json();

  // Vapi sends multiple webhook event types — only process end-of-call
  const eventType = body.message?.type ?? body.type;
  if (eventType && eventType !== "end-of-call-report") {
    return NextResponse.json({ success: true, skipped: eventType });
  }

  // Vapi end-of-call payload
  const callId = body.call?.id ?? body.call_id;
  const phoneNumber = body.call?.customer?.number ?? body.phone_number;
  const duration = body.call?.duration ?? body.duration ?? 0;
  const transcriptUrl = body.call?.transcript_url ?? body.transcript_url;
  const endedReason = body.call?.ended_reason ?? body.ended_reason ?? "unknown";

  if (!callId) {
    return NextResponse.json({ error: "No call_id in payload" }, { status: 400 });
  }

  try {
    // 1. Look for existing lead created during the call
    const { data: existingLead } = await supabase
      .from("leads")
      .select("*, customer:customers(*)")
      .eq("vapi_call_id", callId)
      .limit(1)
      .single();

    const crmBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

    // Get notification email
    let notificationEmail = DEFAULT_NOTIFICATION_EMAIL;
    if (existingLead?.assigned_to) {
      const { data: member } = await supabase
        .from("team_members")
        .select("notification_email, email")
        .eq("id", existingLead.assigned_to)
        .single();
      if (member) {
        notificationEmail = member.notification_email ?? member.email;
      }
    }

    if (existingLead) {
      // Update lead with call metadata
      await supabase
        .from("leads")
        .update({
          call_transcript_url: transcriptUrl,
          call_duration_seconds: duration,
        })
        .eq("id", existingLead.id);

      // Check if this lead has a calendar event (booked appointment)
      const { data: event } = await supabase
        .from("calendar_events")
        .select("*, team_member:team_members(name)")
        .eq("lead_id", existingLead.id)
        .limit(1)
        .single();

      if (event && existingLead.status === "booked") {
        // Qualified lead with appointment
        const template = qualifiedLeadEmail({
          customer_name: existingLead.customer?.name ?? "Unknown",
          customer_phone: existingLead.customer?.phone ?? phoneNumber ?? "",
          customer_address: event.customer_address ?? existingLead.customer?.address ?? "",
          service_type: existingLead.project_type ?? "",
          project_description: existingLead.project_description ?? "",
          appointment_time: event.start_time,
          assigned_rep: event.team_member?.name ?? "Unassigned",
          call_duration_seconds: duration,
          transcript_url: transcriptUrl,
          lead_id: existingLead.id,
          crm_base_url: crmBaseUrl,
        });
        await sendEmail(notificationEmail, template.subject, template.html);
      } else if (existingLead.project_type === "Firewood Delivery") {
        // Firewood order
        const template = firewoodEmail({
          customer_name: existingLead.customer?.name ?? "Unknown",
          customer_phone: existingLead.customer?.phone ?? phoneNumber ?? "",
          message: existingLead.project_description ?? "",
        });
        await sendEmail(notificationEmail, template.subject, template.html);
      } else {
        // Callback request or unscheduled lead
        const template = callbackEmail({
          customer_name: existingLead.customer?.name ?? "Unknown",
          customer_phone: existingLead.customer?.phone ?? phoneNumber ?? "",
          message: existingLead.project_description ?? "",
          service_type: existingLead.project_type,
        });
        await sendEmail(notificationEmail, template.subject, template.html);
      }
    } else {
      // No lead created during call — missed/abandoned call
      if (phoneNumber) {
        const customerId = await findOrCreateCustomer({
          name: "Unknown Caller",
          phone: phoneNumber,
        });

        await supabase.from("leads").insert({
          customer_id: customerId,
          status: "new",
          vapi_call_id: callId,
          call_transcript_url: transcriptUrl,
          call_duration_seconds: duration,
          project_description: `Missed call — ${endedReason}`,
        });
      }

      const template = missedLeadEmail({
        customer_phone: phoneNumber,
        call_duration_seconds: duration,
        ended_reason: endedReason,
      });
      await sendEmail(notificationEmail, template.subject, template.html);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/send-email.ts src/lib/email-templates.ts src/app/(crm)/api/leads/from-call/ src/app/(crm)/api/vapi/
git commit -m "feat: add lead-from-call endpoint, Vapi webhook handler, email templates"
```

---

## Task 6: Calendar UI

**Files:**
- Create: `src/app/(crm)/calendar/page.tsx`
- Create: `src/components/calendar/CalendarView.tsx`
- Create: `src/components/calendar/EventModal.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/lib/demo-data.ts`

- [ ] **Step 1: Add Calendar nav item to Sidebar**

In `src/components/Sidebar.tsx`, add the import:
```typescript
import { Calendar } from "lucide-react";
```

Add to `navItems` array after Invoices:
```typescript
{ href: "/calendar", label: "Calendar", icon: Calendar },
```

- [ ] **Step 2: Add demo calendar data**

Add to `src/lib/demo-data.ts`:

```typescript
import type { AvailabilityRule, CalendarEvent } from "./types";

// Evan Ellis's availability (Mon-Fri 8am-5pm)
export const demoAvailability: AvailabilityRule[] = [
  { id: "ar-1", team_member_id: "tm-1", day_of_week: 1, start_time: "08:00", end_time: "17:00", is_enabled: true },
  { id: "ar-2", team_member_id: "tm-1", day_of_week: 2, start_time: "08:00", end_time: "17:00", is_enabled: true },
  { id: "ar-3", team_member_id: "tm-1", day_of_week: 3, start_time: "08:00", end_time: "17:00", is_enabled: true },
  { id: "ar-4", team_member_id: "tm-1", day_of_week: 4, start_time: "08:00", end_time: "17:00", is_enabled: true },
  { id: "ar-5", team_member_id: "tm-1", day_of_week: 5, start_time: "08:00", end_time: "17:00", is_enabled: true },
];

export const demoCalendarEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    team_member_id: "tm-1",
    type: "quote_visit",
    status: "scheduled",
    title: "Quote: Steve & Linda Morales",
    description: null,
    start_time: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0] + "T14:00:00Z",
    end_time: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0] + "T15:00:00Z",
    customer_name: "Steve & Linda Morales",
    customer_phone: "(765) 555-0101",
    customer_address: "1234 Oak St, Greentown, IN",
    service_type: "Concrete Patio",
    project_description: "20x20 stamped patio with fire pit pad",
    created_by: "agent",
    lead_id: "l-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "evt-2",
    team_member_id: "tm-1",
    type: "quote_visit",
    status: "scheduled",
    title: "Quote: Brian Whitfield",
    description: null,
    start_time: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0] + "T10:00:00Z",
    end_time: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0] + "T11:00:00Z",
    customer_name: "Brian Whitfield",
    customer_phone: "(765) 555-0202",
    customer_address: "567 Maple Ave, Kokomo, IN",
    service_type: "Concrete Driveway",
    project_description: "Replace cracked driveway, exposed aggregate finish",
    created_by: "manual",
    lead_id: "l-2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "evt-3",
    team_member_id: "tm-1",
    type: "blocked",
    status: "scheduled",
    title: "Lunch",
    description: null,
    start_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T16:00:00Z",
    end_time: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T17:00:00Z",
    customer_name: null,
    customer_phone: null,
    customer_address: null,
    service_type: null,
    project_description: null,
    created_by: "manual",
    lead_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
```

Replace the entire `demoTeam` array to match the new `TeamMember` interface:

```typescript
export const demoTeam: TeamMember[] = [
  { id: "tm-1", name: "Evan Ellis", email: "evan@thefinishingtouchllc.com", role: "admin", phone: "765-628-3489", color: "#0085FF", notification_email: "evan@thefinishingtouchllc.com", is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "tm-2", name: "John Horner", email: "john@thefinishingtouchllc.com", role: "crew", phone: null, color: "#10B981", notification_email: null, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "tm-3", name: "Tanner Moyers", email: "tanner@thefinishingtouchllc.com", role: "crew", phone: null, color: "#8B5CF6", notification_email: null, is_active: true, created_at: "2026-01-01T00:00:00Z" },
];
```

- [ ] **Step 3: Create EventModal component**

```typescript
// src/components/calendar/EventModal.tsx
"use client";

import { useState } from "react";
import { X, Clock, User, MapPin, Phone, FileText } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onSave?: (event: Partial<CalendarEvent>) => void;
  onDelete?: (id: string) => void;
}

export default function EventModal({ event, onClose, onSave, onDelete }: EventModalProps) {
  if (!event) return null;

  const isQuote = event.type === "quote_visit";
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                event.type === "quote_visit" ? "bg-[#0085FF]/10 text-[#0085FF]" :
                event.type === "blocked" ? "bg-slate-100 text-slate-600" :
                "bg-purple-50 text-purple-600"
              }`}>
                {event.type === "quote_visit" ? "Quote Visit" : event.type === "blocked" ? "Blocked" : "Personal"}
              </span>
              {event.created_by === "agent" && (
                <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Booked by AI
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">
              {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
              {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} —{" "}
              {endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>

          {isQuote && event.customer_name && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">{event.customer_name}</span>
              </div>
              {event.customer_phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${event.customer_phone}`} className="text-[#0085FF] hover:underline">{event.customer_phone}</a>
                </div>
              )}
              {event.customer_address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{event.customer_address}</span>
                </div>
              )}
              {event.project_description && (
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-700">{event.project_description}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Cancel Event
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0177E3]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create CalendarView component**

Custom weekly calendar built with CSS grid. Handles event rendering, navigation, and click-to-view.

```typescript
// src/components/calendar/CalendarView.tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import EventModal from "./EventModal";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am - 6pm
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDeleteEvent?: (id: string) => void;
}

export default function CalendarView({ events, onDeleteEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function prevWeek() {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 7);
      return n;
    });
  }

  function nextWeek() {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 7);
      return n;
    });
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function getEventsForDay(date: Date): CalendarEvent[] {
    const dayStr = date.toISOString().split("T")[0];
    return events.filter((e) => {
      const eventDay = new Date(e.start_time).toISOString().split("T")[0];
      return eventDay === dayStr && e.status !== "cancelled";
    });
  }

  function getEventStyle(event: CalendarEvent): React.CSSProperties {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 7) * 60; // 7am is 0
    const height = (endHour - startHour) * 60;
    return { top: `${top}px`, height: `${Math.max(height, 20)}px` };
  }

  function getEventColor(event: CalendarEvent): string {
    if (event.type === "blocked") return "bg-slate-200 border-slate-300 text-slate-600";
    if (event.type === "personal") return "bg-purple-100 border-purple-300 text-purple-800";
    return "bg-[#0085FF]/10 border-[#0085FF]/30 text-[#0085FF]";
  }

  const monthLabel = weekDates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={goToday} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Today
            </button>
            <button onClick={nextWeek} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Week grid */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200">
          <div className="p-2" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-2 text-center border-l border-slate-200 ${isToday ? "bg-[#0085FF]/5" : ""}`}>
                <div className="text-xs text-slate-500">{DAYS[date.getDay()]}</div>
                <div className={`text-lg font-semibold ${isToday ? "text-[#0085FF]" : "text-[#0F172A]"}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: `${HOURS.length * 60}px` }}>
          {/* Hour labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 w-[60px] text-right pr-2 text-xs text-slate-400"
              style={{ top: `${(hour - 7) * 60 - 8}px` }}
            >
              {formatHour(hour)}
            </div>
          ))}

          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={`line-${hour}`}
              className="absolute left-[60px] right-0 border-t border-slate-100"
              style={{ top: `${(hour - 7) * 60}px` }}
            />
          ))}

          {/* Day columns with events */}
          {weekDates.map((date, dayIdx) => {
            const dayEvents = getEventsForDay(date);
            return (
              <div
                key={dayIdx}
                className="relative border-l border-slate-200"
                style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
              >
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event)}`}
                    style={getEventStyle(event)}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event detail modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={onDeleteEvent}
      />
    </div>
  );
}
```

- [ ] **Step 5: Create calendar page**

```typescript
// src/app/(crm)/calendar/page.tsx
import CalendarView from "@/components/calendar/CalendarView";
import { demoCalendarEvents } from "@/lib/demo-data";

export default function CalendarPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage quote visits and team schedules.
        </p>
      </div>
      <CalendarView events={demoCalendarEvents} />
    </div>
  );
}
```

- [ ] **Step 6: Build and verify**

```bash
cd /Users/isaacwalden/thefinishingtouch && npx next build
```

Expected: Build passes with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(crm)/calendar/ src/components/calendar/ src/components/Sidebar.tsx src/lib/demo-data.ts
git commit -m "feat: add calendar UI with weekly view, event modal, and nav item"
```

---

## Task 7: Vapi Agent Configuration

**Files:**
- Create: `src/lib/vapi-config.ts`

This task documents the Vapi dashboard configuration and creates a reference config file. Vapi agents are configured through their dashboard or API, not in the Next.js codebase directly.

- [ ] **Step 1: Create Vapi config reference**

```typescript
// src/lib/vapi-config.ts
/**
 * Vapi Agent Configuration Reference
 *
 * This file documents the Vapi agent settings. The actual agent
 * is configured via the Vapi dashboard at https://dashboard.vapi.ai
 *
 * Agent Name: Jake - The Finishing Touch
 * Model: GPT-4o Realtime
 * Voice: GPT-4o Realtime native voice
 */

export const VAPI_SYSTEM_PROMPT = `You are Jake, the front office coordinator at The Finishing Touch LLC, a family-owned concrete and outdoor renovation company in Greentown, Indiana. You've been with the company for a while and know the business well.

## Your Personality
- Laid back, helpful, and conversational. Small-town Indiana friendly.
- Use natural speech: "yeah" not "yes", "we'll get you taken care of" not "we'll schedule your appointment"
- Use natural filler: "let me check on that real quick", "alright so", "perfect"
- You're not reading a script. You're having a conversation.

## Services You Know About
1. Concrete Patios — stamped, broom finish, colored, with fire pit pads
2. Concrete Driveways — standard, exposed aggregate, stamped
3. Stamped Concrete — patterns like ashlar slate, herringbone, cobblestone
4. Decorative Concrete Curbing — clean edges, creative patterns for landscaping
5. Post Frame Buildings — garages, workshops, storage buildings (common sizes: 24x30, 30x40, 40x60)
6. Landscaping — retaining walls, grading, planting, full outdoor renovations
7. Firewood Delivery — seasoned hardwood, sold by the rick

## Your Job on This Call
1. Find out what they need (which service, what they're envisioning)
2. Get their name, phone number, and the address where the work would be done
3. Check your calendar for available times and book a free quote visit
4. For firewood orders: take the order details (quantity, delivery address) — no visit needed

## Important Rules
- NEVER give pricing. Say: "Every project is a little different — that's why we like to come out and take a look first. Let me get you set up with a free quote visit."
- For complaints, billing, or existing project questions, say: "Let me have Evan give you a call back on that" and take their info.
- Service area is Greentown, IN and surrounding Howard County. If someone is clearly too far, let them know politely.
- If you can't find available times, say: "Looks like we're pretty booked up this week — want me to check next week?" If still nothing: "I'll have Evan give you a call to work something out."
- If a system error happens, say: "I'm having a little trouble pulling that up — let me take your info and have Evan call you right back."
- If someone asks if you're an AI, be honest: "Yeah I'm actually an AI assistant — but I can get you set up with a quote just the same."
- The company was founded over 25 years ago. It's run by Evan Ellis. Family-owned, quality-first.

## Conversation Style
- Don't rush through collecting information. Have a natural conversation.
- If they describe their project, engage with it: "Oh nice, a stamped patio would look great back there"
- Ask ONE question at a time. Don't list multiple questions.
- Confirm the appointment details before ending: "Alright so we've got you down for [day] at [time] at [address]. Someone will be out to take a look and get you a quote."
`;

export const VAPI_TOOLS = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check the calendar for available appointment slots in a date range",
      parameters: {
        type: "object",
        properties: {
          date_range_start: {
            type: "string",
            description: "Start date in YYYY-MM-DD format",
          },
          date_range_end: {
            type: "string",
            description: "End date in YYYY-MM-DD format",
          },
        },
        required: ["date_range_start", "date_range_end"],
      },
    },
    server: {
      url: "{CRM_BASE_URL}/api/calendar/availability",
      method: "GET",
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Book a quote visit appointment for the customer",
      parameters: {
        type: "object",
        properties: {
          datetime: { type: "string", description: "Appointment start time in ISO 8601 format" },
          customer_name: { type: "string", description: "Customer's full name" },
          customer_phone: { type: "string", description: "Customer's phone number" },
          customer_address: { type: "string", description: "Property address for the quote visit" },
          service_type: { type: "string", description: "Type of service requested" },
          project_description: { type: "string", description: "Description of what the customer wants done" },
        },
        required: ["datetime", "customer_name", "customer_phone", "customer_address", "service_type"],
      },
    },
    server: {
      url: "{CRM_BASE_URL}/api/calendar/events",
      method: "POST",
    },
  },
  {
    type: "function",
    function: {
      name: "send_message",
      description: "Take a message for callback, firewood order, or when booking isn't possible",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer's full name" },
          customer_phone: { type: "string", description: "Customer's phone number" },
          message: { type: "string", description: "The message or order details" },
          service_type: { type: "string", description: "Type of service if applicable" },
        },
        required: ["customer_name", "customer_phone", "message"],
      },
    },
    server: {
      url: "{CRM_BASE_URL}/api/leads/from-call",
      method: "POST",
    },
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/vapi-config.ts
git commit -m "feat: add Vapi agent system prompt and tool definitions"
```

---

## Task 8: Environment Variables + Final Wiring

- [ ] **Step 1: Document required env vars**

Add to `.env.example` (create if not exists):

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
RESEND_API_KEY=

# New — AI Phone Receptionist
VAPI_API_KEY=              # API key shared with Vapi for auth
NEXT_PUBLIC_APP_URL=       # CRM base URL for email links (e.g., https://app.thefinishingtouchllc.com)
```

- [ ] **Step 2: Build and verify everything compiles**

```bash
cd /Users/isaacwalden/thefinishingtouch && npx next build
```

Expected: Clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add environment variables for Vapi integration"
```

---

## Deployment Checklist (Post-Implementation)

After all tasks are complete, these steps happen outside the codebase:

1. **Supabase:** Run migration 003, seed Evan's team_member record + availability rules
2. **Vercel:** Add `VAPI_API_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` env vars
3. **Resend:** Verify domain `thefinishingtouchllc.com` and get API key
4. **Vapi Dashboard:**
   - Create new agent with the system prompt from `vapi-config.ts`
   - Set model to GPT-4o Realtime
   - Configure the 3 function call tools with the production CRM URL
   - Set the end-of-call webhook to `{CRM_BASE_URL}/api/vapi/webhook`
   - Add `x-api-key` header to all server tool requests
   - Purchase/port a phone number (or use Vapi's forwarding to 765-628-3489)
5. **Test:** Make a test call, verify the full flow: call → qualification → booking → email
