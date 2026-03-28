-- Migration 004: New tables, columns, and RLS policies for full CRM backend
-- Adds: customer_tags, estimate_templates, estimate_revisions, estimate_approvals,
--        invoice_views, invoice_splits, vision_shares, vision_annotations,
--        referrals, campaign_recipients, automation_enrollments, company_settings,
--        notification_preferences, integrations, audit_log, agent_templates
-- Alters: leads (priority), customers (tags), vision_projects (starred)

-- ── Column additions to existing tables ──

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Vision projects may not exist yet as a table, create if not exists
CREATE TABLE IF NOT EXISTS vision_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  original_image_url TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vision_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES vision_projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  add_on TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add starred column if vision_projects already existed
ALTER TABLE vision_projects
  ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;

-- ── Estimates table (may not exist yet) ──

CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'accepted', 'declined');

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  status estimate_status NOT NULL DEFAULT 'draft',
  project_type TEXT NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb,
  materials TEXT[] DEFAULT '{}',
  complexity TEXT DEFAULT 'moderate' CHECK (complexity IN ('easy', 'moderate', 'difficult')),
  options JSONB DEFAULT '{}'::jsonb,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  margin NUMERIC(5, 4) NOT NULL DEFAULT 0.35,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  timeline TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);

CREATE TRIGGER estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── AI Agents table (may not exist yet) ──

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lead_followup', 'quote_followup', 'review_request', 'website_chatbot')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('active', 'paused')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_run TIMESTAMPTZ,
  actions_today INT DEFAULT 0,
  actions_this_week INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('email_sent', 'sms_sent', 'escalated', 'lead_created', 'review_requested')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending_approval', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_agent ON agent_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);

-- ── Marketing tables (may not exist yet) ──

CREATE TABLE IF NOT EXISTS marketing_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email ON marketing_contacts(email);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'custom' CHECK (category IN ('seasonal_promo', 'new_service', 'project_showcase', 'review_request', 'custom')),
  merge_fields TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  segment_tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipients_count INT DEFAULT 0,
  opens INT DEFAULT 0,
  clicks INT DEFAULT 0,
  unsubscribes INT DEFAULT 0,
  ab_test_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft')),
  emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  enrolled_count INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════
-- NEW TABLES
-- ══════════════════════════════════════════════

-- Customer tags (normalized)
CREATE TABLE customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, tag)
);

CREATE INDEX idx_customer_tags_customer ON customer_tags(customer_id);
CREATE INDEX idx_customer_tags_tag ON customer_tags(tag);

-- Estimate templates
CREATE TABLE estimate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  materials TEXT[] DEFAULT '{}',
  options JSONB DEFAULT '{}'::jsonb,
  margin NUMERIC(5, 4) DEFAULT 0.35,
  terms TEXT,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estimate revisions (snapshot history)
CREATE TABLE estimate_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estimate_id, revision_number)
);

CREATE INDEX idx_estimate_revisions_estimate ON estimate_revisions(estimate_id);

-- Estimate approvals (token-based customer approval)
CREATE TABLE estimate_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'changes_requested')),
  customer_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_estimate_approvals_token ON estimate_approvals(token);
CREATE INDEX idx_estimate_approvals_estimate ON estimate_approvals(estimate_id);

-- Invoice view tracking
CREATE TABLE invoice_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'email'
);

CREATE INDEX idx_invoice_views_invoice ON invoice_views(invoice_id);

-- Invoice splits (deposit / final)
CREATE TABLE invoice_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  deposit_invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  final_invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  split_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_splits_parent ON invoice_splits(parent_invoice_id);

-- Vision shares (public link tokens)
CREATE TABLE vision_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES vision_projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vision_shares_token ON vision_shares(token);

-- Vision annotations
CREATE TABLE vision_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iteration_id UUID NOT NULL REFERENCES vision_iterations(id) ON DELETE CASCADE,
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vision_annotations_iteration ON vision_annotations(iteration_id);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referred_contact_id UUID REFERENCES marketing_contacts(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_customer_id);

-- Campaign recipients (individual tracking)
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES marketing_contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'bounced')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE (campaign_id, contact_id)
);

CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_contact ON campaign_recipients(contact_id);

-- Automation enrollments
CREATE TABLE automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES marketing_contacts(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'unsubscribed')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_email_at TIMESTAMPTZ,
  UNIQUE (automation_id, contact_id)
);

CREATE INDEX idx_automation_enrollments_automation ON automation_enrollments(automation_id);
CREATE INDEX idx_automation_enrollments_next ON automation_enrollments(next_email_at) WHERE status = 'active';

-- Company settings (key-value store)
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, event, channel)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_category ON audit_log(category);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Agent templates
CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_templates_agent ON agent_templates(agent_id);

-- ══════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════

-- Helper: enable RLS on all new tables
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Internal CRM: authenticated users can read/write everything
-- Pattern: read for all authenticated, write for all authenticated

-- Customers
CREATE POLICY "auth_read_customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Leads
CREATE POLICY "auth_read_leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_leads" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Activities
CREATE POLICY "auth_read_activities" ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_activities" ON activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Invoices
CREATE POLICY "auth_read_invoices" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_invoices" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payments
CREATE POLICY "auth_read_payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customer tags
CREATE POLICY "auth_read_customer_tags" ON customer_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_customer_tags" ON customer_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Estimates
CREATE POLICY "auth_read_estimates" ON estimates FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_estimates" ON estimates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Estimate templates
CREATE POLICY "auth_read_estimate_templates" ON estimate_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_estimate_templates" ON estimate_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Estimate revisions
CREATE POLICY "auth_read_estimate_revisions" ON estimate_revisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_estimate_revisions" ON estimate_revisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Estimate approvals (also needs anon access for customer-facing approval page)
CREATE POLICY "auth_read_estimate_approvals" ON estimate_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_estimate_approvals" ON estimate_approvals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_estimate_approvals" ON estimate_approvals FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_estimate_approvals" ON estimate_approvals FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Invoice views (also needs anon access for tracking pixel)
CREATE POLICY "auth_read_invoice_views" ON invoice_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_invoice_views" ON invoice_views FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_invoice_views" ON invoice_views FOR INSERT TO anon WITH CHECK (true);

-- Invoice splits
CREATE POLICY "auth_read_invoice_splits" ON invoice_splits FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_invoice_splits" ON invoice_splits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vision projects
CREATE POLICY "auth_read_vision_projects" ON vision_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_vision_projects" ON vision_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vision iterations
CREATE POLICY "auth_read_vision_iterations" ON vision_iterations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_vision_iterations" ON vision_iterations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vision shares (anon access for public share link)
CREATE POLICY "auth_read_vision_shares" ON vision_shares FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_vision_shares" ON vision_shares FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_vision_shares" ON vision_shares FOR SELECT TO anon USING (true);

-- Vision annotations
CREATE POLICY "auth_read_vision_annotations" ON vision_annotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_vision_annotations" ON vision_annotations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Referrals (anon access for public referral landing)
CREATE POLICY "auth_read_referrals" ON referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_referrals" ON referrals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_referrals" ON referrals FOR SELECT TO anon USING (true);

-- Campaign recipients
CREATE POLICY "auth_read_campaign_recipients" ON campaign_recipients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_campaign_recipients" ON campaign_recipients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Automation enrollments
CREATE POLICY "auth_read_automation_enrollments" ON automation_enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_automation_enrollments" ON automation_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Company settings
CREATE POLICY "auth_read_company_settings" ON company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_company_settings" ON company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notification preferences
CREATE POLICY "auth_read_notification_prefs" ON notification_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_notification_prefs" ON notification_preferences FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Integrations
CREATE POLICY "auth_read_integrations" ON integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_integrations" ON integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit log (read-only for most, insert for all authenticated)
CREATE POLICY "auth_read_audit_log" ON audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_audit_log" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- AI agents
CREATE POLICY "auth_read_ai_agents" ON ai_agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_ai_agents" ON ai_agents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Agent actions
CREATE POLICY "auth_read_agent_actions" ON agent_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_agent_actions" ON agent_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Agent templates
CREATE POLICY "auth_read_agent_templates" ON agent_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_agent_templates" ON agent_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Marketing contacts
CREATE POLICY "auth_read_marketing_contacts" ON marketing_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_marketing_contacts" ON marketing_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Email templates
CREATE POLICY "auth_read_email_templates" ON email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_email_templates" ON email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Campaigns
CREATE POLICY "auth_read_campaigns" ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_campaigns" ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Automations
CREATE POLICY "auth_read_automations" ON automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_automations" ON automations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Service-role bypass for API routes ──
-- The supabase client used in API routes uses the anon key,
-- but server-side operations (webhooks, public pages) need anon policies above.
-- Authenticated user policies cover all internal CRM usage.
