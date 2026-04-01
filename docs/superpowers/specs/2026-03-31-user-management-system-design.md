# User Management System — Multi-Tenant Auth & RBAC

## Summary

Multi-tenant user management system with Supabase Auth. Companies self-serve signup, owners invite their team with role-based access, all data isolated by company. Super-admin role for Isaac to view/manage any company.

## Current State

- Middleware checks for Supabase auth tokens but allows all requests (demo mode)
- No login, signup, or invite pages exist
- `team_members` table has roles (admin/manager/crew/sales_rep) but is not linked to auth
- `api-auth.ts` only handles Vapi API key validation
- `supabase.ts` uses a single anon client — no per-user session handling
- No `company_id` on any existing table — single-tenant assumed

## Data Model

### New Tables

**`companies`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default `gen_random_uuid()` |
| name | text | Company display name |
| slug | text (unique) | URL-friendly identifier |
| logo_url | text | Nullable |
| phone | text | Nullable |
| email | text | Nullable |
| address | text | Nullable |
| city | text | Nullable |
| state | text | Nullable |
| zip | text | Nullable |
| is_active | boolean | Default `true`, gates access |
| created_at | timestamptz | Default `now()` |

**`users`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Matches Supabase `auth.users.id` |
| company_id | uuid (FK) | References `companies.id` |
| name | text | Display name |
| email | text | Matches auth email |
| role | text | `owner`, `admin`, `manager`, `crew`, `sales_rep` |
| is_super_admin | boolean | Default `false`. Only Isaac. |
| is_active | boolean | Default `true` |
| created_at | timestamptz | Default `now()` |

**`invites`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default `gen_random_uuid()` |
| company_id | uuid (FK) | References `companies.id` |
| email | text | Invited email |
| role | text | Role assigned on acceptance |
| token | text (unique) | Random token for invite URL |
| expires_at | timestamptz | 7-day expiry |
| accepted_at | timestamptz | Nullable, set on acceptance |
| created_at | timestamptz | Default `now()` |

### Existing Table Changes

Add `company_id uuid REFERENCES companies(id)` to:
- `customers`
- `leads`
- `estimates`
- `invoices`
- `job_walks`
- `calendar_events`
- `activities`
- `audit_log`
- `payments`
- `marketing_contacts`
- `marketing_campaigns`
- `marketing_templates`
- `marketing_automations`
- `vision_projects`

The `team_members` table becomes redundant — replaced by `users`. Existing team member data migrates to `users` records during the migration.

### Type Updates

```typescript
type UserRole = "owner" | "admin" | "manager" | "crew" | "sales_rep";

interface AppUser {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

interface Invite {
  id: string;
  company_id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
}
```

## Auth Flows

### Signup (Company Owner)

1. `/signup` page — fields: name, email, password, company name
2. Calls `POST /api/auth/signup`
3. API creates Supabase auth user, inserts `companies` row, inserts `users` row with role `owner`
4. Sets auth cookies, redirects to `/dashboard`

### Login

1. `/login` page — fields: email, password
2. Calls `POST /api/auth/login`
3. API calls `supabase.auth.signInWithPassword()`, sets cookies
4. Redirects to `/dashboard`

### Invite Flow

1. Owner/admin goes to Settings > Team, enters email + role
2. Calls `POST /api/auth/invite` — creates `invites` row, sends email with link
3. Invitee visits `/invite/[token]` — page validates token, shows form: name, password
4. On submit, calls `POST /api/auth/accept-invite`
5. API creates Supabase auth user + `users` row linked to the invite's company
6. Sets cookies, redirects to `/dashboard`

### Logout

1. `POST /api/auth/logout` — clears auth cookies
2. Redirects to `/login`

## Middleware

Update `src/middleware.ts`:

- **Public paths** (no auth required): `/login`, `/signup`, `/invite`, `/pay`, `/api/webhooks`, `/api/vapi`, `/api/chatbot`, `/api/marketing/track`, `/api/marketing/unsubscribe`
- **All other paths**: require valid Supabase auth token in cookies
- If no valid token, redirect to `/login`
- Remove all "demo mode" fallthrough logic

## Session Helper

New file: `src/lib/session.ts`

```typescript
async function getSessionUser(request: Request): Promise<{
  userId: string;
  companyId: string;
  role: UserRole;
  isSuperAdmin: boolean;
}>
```

- Extracts auth token from cookies
- Looks up `users` row by auth UID
- Returns user context or throws 401
- Every API route calls this first

## Authorization (Role-Based Access)

### Route Permissions

| Resource | owner | admin | manager | sales_rep | crew |
|----------|-------|-------|---------|-----------|------|
| Dashboard | full | full | full | full | limited (own jobs) |
| Leads | full | full | full | full | no |
| Customers | full | full | full | full | assigned only |
| Estimates | full | full | full | full | no |
| Invoices | full | full | full | no | no |
| Calendar | full | full | full | own | own |
| Job Walks | full | full | full | full | assigned only |
| Vision Studio | full | full | full | full | no |
| AI Agents | full | full | no | no | no |
| Marketing | full | full | full | no | no |
| Settings | full | full | no | no | no |
| Team Management | full | full | no | no | no |

### Data Isolation

- Every API query includes `.eq('company_id', companyId)`
- Super-admin bypasses company filter when impersonating
- No cross-company data access under any circumstance

### Supabase RLS Policies

All tables with `company_id` get:
```sql
CREATE POLICY "company_isolation" ON [table]
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
  );
```

## Super-Admin

- `is_super_admin = true` on Isaac's user record
- Company switcher dropdown in the CRM header — lists all companies
- When a company is selected, all API calls scope to that company's data
- Stored in a cookie or session param (`x-impersonate-company`)
- Super-admin can: view any company's data, toggle `is_active` on companies, view all users

## UI Changes

### New Pages

- **`/login`** — email/password form, link to signup
- **`/signup`** — name, email, password, company name form
- **`/invite/[token]`** — validate token, show name/password form

All three are public routes outside the `(crm)` layout.

### Modified Pages

- **`src/app/(crm)/layout.tsx`** — wrap with user context provider, show user name + logout in sidebar
- **Settings > Team** — rewire from `team_members` to `users` table, replace "add member" form with invite flow (email + role, sends invite)
- **Sidebar/header** — super-admin sees company switcher dropdown

### No Visual Changes

All other CRM pages remain visually identical. They receive company-scoped data automatically through the API layer.

## API Routes

### New Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/signup` | POST | Create company + owner user |
| `/api/auth/login` | POST | Authenticate, set cookies |
| `/api/auth/logout` | POST | Clear cookies |
| `/api/auth/invite` | POST | Create invite, send email |
| `/api/auth/accept-invite` | POST | Accept invite, create user |
| `/api/auth/me` | GET | Return current user + company |
| `/api/admin/companies` | GET | Super-admin: list all companies |
| `/api/admin/companies/[id]` | PATCH | Super-admin: toggle active |

### Modified Routes

Every existing API route that queries a data table adds `company_id` filtering via `getSessionUser()`.

## Files Changed

### New Files
- `src/app/(public)/login/page.tsx`
- `src/app/(public)/signup/page.tsx`
- `src/app/(public)/invite/[token]/page.tsx`
- `src/lib/session.ts`
- `src/contexts/AuthContext.tsx`
- `src/app/(crm)/api/auth/signup/route.ts`
- `src/app/(crm)/api/auth/login/route.ts`
- `src/app/(crm)/api/auth/logout/route.ts`
- `src/app/(crm)/api/auth/invite/route.ts`
- `src/app/(crm)/api/auth/accept-invite/route.ts`
- `src/app/(crm)/api/auth/me/route.ts`
- `src/app/(crm)/api/admin/companies/route.ts`
- `src/app/(crm)/api/admin/companies/[id]/route.ts`
- `supabase/migrations/006_user_management.sql`

### Modified Files
- `src/middleware.ts` — enforce auth, remove demo mode
- `src/app/(crm)/layout.tsx` — auth context provider, user display
- `src/components/settings/TeamMembers.tsx` — rewire to users + invites
- `src/lib/types.ts` — add AppUser, Company, Invite types, UserRole
- `src/lib/supabase.ts` — add server client with cookie-based auth
- All existing API routes — add `getSessionUser()` + `company_id` filter

## Out of Scope

- Stripe billing / subscription gating (use `is_active` flag for now)
- Password reset flow (use Supabase built-in reset email)
- Email verification on signup (defer to Supabase default behavior)
- OAuth / social login (email + password only)
- Per-user notification preferences
- Audit logging of auth events (login, logout, invite)
