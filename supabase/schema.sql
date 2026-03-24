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
