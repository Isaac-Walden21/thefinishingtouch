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
