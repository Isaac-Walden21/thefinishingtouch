-- Add QuickBooks OAuth token columns to companies table for multi-tenant QB integration
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qb_realm_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qb_access_token TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qb_refresh_token TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qb_token_expires_at TIMESTAMPTZ;
