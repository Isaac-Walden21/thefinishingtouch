-- Migration 005: Job Walks tables, indexes, and RLS policies
-- Adds: job_walks, job_walk_photos

-- ── job_walks table ──

CREATE TABLE job_walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'estimated')),
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  site_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  sketch_url TEXT,
  voice_note_url TEXT,
  voice_transcript TEXT,
  gps_lat DECIMAL,
  gps_lng DECIMAL,
  weather JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_job_walks_customer ON job_walks(customer_id);
CREATE INDEX idx_job_walks_status ON job_walks(status);
CREATE INDEX idx_job_walks_created ON job_walks(created_at DESC);
CREATE INDEX idx_job_walks_lead ON job_walks(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_job_walks_calendar_event ON job_walks(calendar_event_id) WHERE calendar_event_id IS NOT NULL;

CREATE TRIGGER job_walks_updated_at
  BEFORE UPDATE ON job_walks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── job_walk_photos table ──

CREATE TABLE job_walk_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_walk_id UUID NOT NULL REFERENCES job_walks(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  category TEXT NOT NULL DEFAULT 'overview' CHECK (category IN ('overview', 'existing_condition', 'obstacle', 'measurement_reference', 'customer_request')),
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_walk_photos_walk ON job_walk_photos(job_walk_id);
CREATE INDEX idx_job_walk_photos_sort ON job_walk_photos(job_walk_id, sort_order);

-- ── Add job_walk_id to estimates for linking ──

ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS job_walk_id UUID REFERENCES job_walks(id) ON DELETE SET NULL;

CREATE INDEX idx_estimates_job_walk ON estimates(job_walk_id) WHERE job_walk_id IS NOT NULL;

-- ── RLS policies ──

ALTER TABLE job_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_walk_photos ENABLE ROW LEVEL SECURITY;

-- Job walks: authenticated users can read/write
CREATE POLICY "auth_read_job_walks" ON job_walks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_job_walks" ON job_walks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Job walk photos: authenticated users can read/write
CREATE POLICY "auth_read_job_walk_photos" ON job_walk_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_job_walk_photos" ON job_walk_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
