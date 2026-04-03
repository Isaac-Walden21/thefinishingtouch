-- 006_user_management.sql
-- Multi-tenant user management: companies, users, invites + company_id on all data tables

-- ── New Tables ──

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY, -- matches auth.users.id
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'crew' CHECK (role IN ('owner', 'admin', 'manager', 'crew', 'sales_rep')),
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'crew' CHECK (role IN ('admin', 'manager', 'crew', 'sales_rep')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_company_id ON invites(company_id);

-- ── Add company_id to existing data tables ──

ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE job_walks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE job_walk_photos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE availability_rules ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE marketing_contacts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE automations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE vision_projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Indexes for company_id on high-traffic tables
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_estimates_company ON estimates(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_job_walks_company ON job_walks(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_company ON calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id);

-- ── RLS Policies ──

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Company isolation policy: user can access rows matching their company_id, or super-admin can access all

CREATE POLICY "company_isolation" ON customers FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON leads FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON estimates FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON invoices FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON job_walks FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON calendar_events FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON activities FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON audit_log FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON payments FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON marketing_contacts FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON email_templates FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON campaigns FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON automations FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON vision_projects FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "company_isolation" ON ai_agents FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

-- Users can see other users in their company
CREATE POLICY "company_isolation" ON users FOR ALL USING (
  company_id = (SELECT company_id FROM users u WHERE u.id = auth.uid())
  OR (SELECT is_super_admin FROM users u WHERE u.id = auth.uid())
);

-- Companies: users can see their own company, super-admin can see all
CREATE POLICY "company_isolation" ON companies FOR ALL USING (
  id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

-- Invites: visible to users in the same company
CREATE POLICY "company_isolation" ON invites FOR ALL USING (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
);

-- Service role bypass for API routes using the service key
-- (Our API routes use the service role client, so RLS is a safety net, not the primary enforcement)
