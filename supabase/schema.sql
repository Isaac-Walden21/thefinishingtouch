-- The Finishing Touch LLC — CRM Schema
-- Module 1: CRM + Pipeline

-- Enum types
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'quoted',
  'booked',
  'in_progress',
  'completed',
  'lost'
);

CREATE TYPE activity_type AS ENUM (
  'call',
  'email',
  'quote',
  'payment',
  'note',
  'ai_action'
);

CREATE TYPE team_role AS ENUM (
  'admin',
  'manager',
  'crew'
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role team_role NOT NULL DEFAULT 'crew',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'IN',
  zip TEXT,
  service_type TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status lead_status NOT NULL DEFAULT 'new',
  quoted_amount NUMERIC(10, 2),
  project_type TEXT,
  project_description TEXT,
  assigned_to UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_customer_id ON activities(customer_id);
CREATE INDEX idx_customers_name ON customers(name);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Module 4: Invoicing & Payments ──

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'partial',
  'paid',
  'overdue',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'stripe',
  'cash',
  'check',
  'other'
);

-- Invoice number sequence (TFT-0001 format)
CREATE SEQUENCE invoice_number_seq START 1;

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  estimate_id UUID,
  invoice_number TEXT NOT NULL DEFAULT 'TFT-' || lpad(nextval('invoice_number_seq')::text, 4, '0'),
  status invoice_status NOT NULL DEFAULT 'draft',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.07,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_method payment_method,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  method payment_method NOT NULL DEFAULT 'other',
  stripe_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- Trigger
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Module 7: Job Walk Intake ──

CREATE TYPE job_walk_status AS ENUM (
  'draft',
  'estimated',
  'sent',
  'converted'
);

-- Job Walks
CREATE TABLE job_walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  estimate_id UUID,
  project_type TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  materials TEXT[] NOT NULL DEFAULT '{}',
  color_stain TEXT,
  complexity TEXT NOT NULL DEFAULT 'moderate',
  options JSONB NOT NULL DEFAULT '{"demolition":false,"grading":false,"sealing":false}'::jsonb,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  ai_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status job_walk_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_job_walks_customer_id ON job_walks(customer_id);
CREATE INDEX idx_job_walks_status ON job_walks(status);
CREATE INDEX idx_job_walks_created_by ON job_walks(created_by);

-- Trigger
CREATE TRIGGER job_walks_updated_at
  BEFORE UPDATE ON job_walks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for job walk photos (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('job-walk-photos', 'job-walk-photos', false);
