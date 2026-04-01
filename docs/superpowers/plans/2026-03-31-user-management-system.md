# User Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Multi-tenant user management with Supabase Auth, role-based access, company data isolation, and super-admin impersonation.

**Architecture:** Supabase Auth for identity, custom `users`/`companies`/`invites` tables for app-level roles and tenancy, middleware enforces auth on all CRM routes, `getSessionUser()` helper provides company-scoped context to every API route, RLS policies as a safety net.

**Tech Stack:** Next.js 15, Supabase Auth (SSR), TypeScript, Tailwind CSS

---

### Task 1: Database Migration — New Tables + company_id Columns

**Files:**
- Create: `supabase/migrations/006_user_management.sql`

- [ ] **Step 1: Write the migration file**

```sql
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
-- Applied to all data tables with company_id

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/006_user_management.sql
git commit -m "feat: migration 006 — companies, users, invites tables + company_id columns + RLS"
```

---

### Task 2: Types + Supabase Server Client + Session Helper

**Files:**
- Modify: `src/lib/types.ts` — add UserRole, AppUser, Company, Invite types
- Modify: `src/lib/supabase.ts` — add server client with cookie auth + admin client
- Create: `src/lib/session.ts` — getSessionUser helper

- [ ] **Step 1: Add types to `src/lib/types.ts`**

Add these at the top of the file, after existing type definitions:

```typescript
// ── Auth & Multi-Tenancy ──

export type UserRole = "owner" | "admin" | "manager" | "crew" | "sales_rep";

export interface AppUser {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Invite {
  id: string;
  company_id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Update `src/lib/supabase.ts`**

Replace the entire file:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Public client (for client-side auth operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (for server-side operations — bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Auth client for server operations with cookie-based session
export function createServerClient(cookieHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { cookie: cookieHeader },
    },
  });
}
```

- [ ] **Step 3: Create `src/lib/session.ts`**

```typescript
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { UserRole, AppUser } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export interface SessionUser {
  userId: string;
  companyId: string;
  role: UserRole;
  isSuperAdmin: boolean;
  user: AppUser;
}

/**
 * Get the authenticated user from the request cookies.
 * Returns session context or throws a Response with 401.
 *
 * Super-admin impersonation: if the user is a super-admin and the
 * `x-impersonate-company` cookie is set, companyId returns the
 * impersonated company instead of the user's own company.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify token with Supabase Auth
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);

  if (!authUser) {
    throw new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up app user record
  const { data: appUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!appUser || !appUser.is_active) {
    throw new Response(JSON.stringify({ error: "User not found or inactive" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check company is active
  const { data: company } = await supabase
    .from("companies")
    .select("is_active")
    .eq("id", appUser.company_id)
    .single();

  if (!company?.is_active && !appUser.is_super_admin) {
    throw new Response(JSON.stringify({ error: "Company account is inactive" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Super-admin impersonation
  let companyId = appUser.company_id;
  if (appUser.is_super_admin) {
    const impersonate = cookieStore.get("x-impersonate-company")?.value;
    if (impersonate) {
      companyId = impersonate;
    }
  }

  return {
    userId: appUser.id,
    companyId,
    role: appUser.role as UserRole,
    isSuperAdmin: appUser.is_super_admin,
    user: appUser as AppUser,
  };
}

/**
 * Check if the user's role is in the allowed list.
 * Throws 403 if not authorized.
 */
export function requireRole(session: SessionUser, allowed: UserRole[]): void {
  if (session.isSuperAdmin) return; // super-admin bypasses all role checks
  if (!allowed.includes(session.role)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (or only pre-existing ones)

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/supabase.ts src/lib/session.ts
git commit -m "feat: auth types, server supabase client, and getSessionUser helper"
```

---

### Task 3: Auth API Routes — Signup, Login, Logout, Me

**Files:**
- Create: `src/app/(crm)/api/auth/signup/route.ts`
- Create: `src/app/(crm)/api/auth/login/route.ts`
- Create: `src/app/(crm)/api/auth/logout/route.ts`
- Create: `src/app/(crm)/api/auth/me/route.ts`

- [ ] **Step 1: Create signup route**

File: `src/app/(crm)/api/auth/signup/route.ts`

```typescript
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password, company_name } = body;

  if (!name || !email || !password || !company_name) {
    return NextResponse.json(
      { error: "Name, email, password, and company name are required" },
      { status: 400 }
    );
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const authUserId = authData.user.id;

  // Generate slug from company name
  const slug = company_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check slug uniqueness
  const { data: existingSlug } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single();

  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

  // Create company
  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .insert({
      name: company_name,
      slug: finalSlug,
    })
    .select("*")
    .single();

  if (companyError) {
    // Cleanup: delete the auth user we just created
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  // Create user record
  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      id: authUserId,
      company_id: company.id,
      name,
      email,
      role: "owner",
    });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    await supabaseAdmin.from("companies").delete().eq("id", company.id);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Sign in to get tokens
  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !session.session) {
    return NextResponse.json({ error: "Account created but sign-in failed" }, { status: 500 });
  }

  const response = NextResponse.json({ user: { id: authUserId, name, email, role: "owner" }, company }, { status: 201 });

  response.cookies.set("sb-access-token", session.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  response.cookies.set("sb-refresh-token", session.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
```

- [ ] **Step 2: Create login route**

File: `src/app/(crm)/api/auth/login/route.ts`

```typescript
import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data: session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !session.session) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Look up app user
  const { data: appUser } = await supabaseAdmin
    .from("users")
    .select("*, company:companies(id, name, slug, is_active)")
    .eq("id", session.user.id)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "User account not found" }, { status: 401 });
  }

  if (!appUser.is_active) {
    return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
  }

  if (appUser.company && !appUser.company.is_active && !appUser.is_super_admin) {
    return NextResponse.json({ error: "Company account is inactive" }, { status: 403 });
  }

  const response = NextResponse.json({
    user: appUser,
    company: appUser.company,
  });

  response.cookies.set("sb-access-token", session.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  response.cookies.set("sb-refresh-token", session.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
```

- [ ] **Step 3: Create logout route**

File: `src/app/(crm)/api/auth/logout/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("sb-access-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("x-impersonate-company", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
```

- [ ] **Step 4: Create me route**

File: `src/app/(crm)/api/auth/me/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSessionUser();

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", session.companyId)
      .single();

    return NextResponse.json({
      user: session.user,
      company,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add src/app/(crm)/api/auth/
git commit -m "feat: auth API routes — signup, login, logout, me"
```

---

### Task 4: Auth Pages — Login + Signup

**Files:**
- Create: `src/app/(public)/login/page.tsx`
- Create: `src/app/(public)/signup/page.tsx`

- [ ] **Step 1: Create login page**

File: `src/app/(public)/login/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
          <p className="mt-2 text-sm text-slate-500">
            Welcome back. Sign in to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0070DD] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[#0085FF] hover:text-[#0070DD]">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create signup page**

File: `src/app/(public)/signup/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company_name: companyName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Set up your company and start managing your business.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-700">
              Company Name
            </label>
            <input
              id="company"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="Your Business LLC"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="8+ characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0070DD] disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#0085FF] hover:text-[#0070DD]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/login/page.tsx src/app/(public)/signup/page.tsx
git commit -m "feat: login and signup pages"
```

---

### Task 5: Middleware — Enforce Auth

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Replace middleware**

Replace the entire contents of `src/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const publicPaths = [
  "/login",
  "/signup",
  "/invite",
  "/pay",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/accept-invite",
  "/api/webhooks",
  "/api/vapi",
  "/api/chatbot",
  "/api/marketing/track",
  "/api/marketing/unsubscribe",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth token
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  if (!accessToken && !refreshToken) {
    // No tokens — redirect to login (unless it's an API route)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (accessToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user } } = await supabase.auth.getUser(accessToken);

      if (user) {
        return NextResponse.next();
      }
    }
  }

  // Token invalid or expired — try refresh
  if (refreshToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (!error && data.session) {
        const response = NextResponse.next();

        response.cookies.set("sb-access-token", data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60,
        });

        response.cookies.set("sb-refresh-token", data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }
    }
  }

  // All auth attempts failed
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: enforce auth middleware — redirect unauthenticated to /login"
```

---

### Task 6: Auth Context Provider + Sidebar User Display

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Modify: `src/app/(crm)/layout.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Create AuthContext**

File: `src/contexts/AuthContext.tsx`

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AppUser, Company } from "@/lib/types";

interface AuthContextValue {
  user: AppUser | null;
  company: Company | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  company: null,
  loading: true,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setCompany(data.company);
      })
      .catch(() => {
        setUser(null);
        setCompany(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, company, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Wrap CRM layout with AuthProvider**

Replace `src/app/(crm)/layout.tsx`:

```typescript
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <Sidebar />
      <main className="min-h-screen lg:ml-64">{children}</main>
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Add user display + logout to Sidebar**

In `src/components/Sidebar.tsx`, add the import at the top:

```typescript
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
```

Add `LogOut` to the existing lucide-react import.

Inside the `Sidebar` component function, after `const [mobileOpen, setMobileOpen] = useState(false);`, add:

```typescript
const { user, company, logout } = useAuth();
```

Find the bottom of the sidebar nav list (after the `navItems.map` block, before the closing `</nav>` or `</div>`). Add this user section at the bottom of the sidebar, just before the sidebar container's closing tag:

```typescript
{/* User section */}
<div className="mt-auto border-t border-white/10 px-3 py-4">
  {user && (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="truncate text-xs text-slate-400">{company?.name}</p>
      </div>
      <button
        onClick={logout}
        className="ml-2 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )}
</div>
```

Note: The exact insertion point depends on the sidebar structure. Look for the main `<div>` that contains the nav items and add the user section at the bottom of that container, ensuring the sidebar uses `flex flex-col` so `mt-auto` pushes it to the bottom. If the sidebar container doesn't already have `flex flex-col h-full`, add those classes.

- [ ] **Step 4: Verify TypeScript compiles and build passes**

Run: `npx tsc --noEmit 2>&1 | head -20`
Run: `npx next build 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add src/contexts/AuthContext.tsx src/app/(crm)/layout.tsx src/components/Sidebar.tsx
git commit -m "feat: auth context provider, user display in sidebar, logout button"
```

---

### Task 7: Invite API Routes + Accept Invite Page

**Files:**
- Create: `src/app/(crm)/api/auth/invite/route.ts`
- Create: `src/app/(crm)/api/auth/accept-invite/route.ts`
- Create: `src/app/(public)/invite/[token]/page.tsx`

- [ ] **Step 1: Create invite route (owner/admin sends invite)**

File: `src/app/(crm)/api/auth/invite/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const validRoles = ["admin", "manager", "crew", "sales_rep"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists in this company
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("company_id", session.companyId)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists in your company" }, { status: 400 });
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabaseAdmin
      .from("invites")
      .select("id")
      .eq("email", email)
      .eq("company_id", session.companyId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: "Pending invite already exists for this email" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .insert({
        company_id: session.companyId,
        email,
        role,
        token,
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Send invite email via Resend with link to /invite/[token]
    // For now, return the token so it can be shared manually

    return NextResponse.json({ invite, invite_url: `/invite/${token}` }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — list pending invites for the company
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

    const { data, error } = await supabaseAdmin
      .from("invites")
      .select("*")
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create accept-invite route**

File: `src/app/(crm)/api/auth/accept-invite/route.ts`

```typescript
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { token, name, password } = await request.json();

  if (!token || !name || !password) {
    return NextResponse.json({ error: "Token, name, and password are required" }, { status: 400 });
  }

  // Look up invite
  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("*, company:companies(id, name)")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create app user record
  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      id: authData.user.id,
      company_id: invite.company_id,
      name,
      email: invite.email,
      role: invite.role,
    });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Mark invite as accepted
  await supabaseAdmin
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Sign in
  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: invite.email,
    password,
  });

  if (signInError || !session.session) {
    return NextResponse.json({ error: "Account created but sign-in failed. Try logging in." }, { status: 500 });
  }

  const response = NextResponse.json({ success: true }, { status: 201 });

  response.cookies.set("sb-access-token", session.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  response.cookies.set("sb-refresh-token", session.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
```

- [ ] **Step 3: Create invite acceptance page**

File: `src/app/(public)/invite/[token]/page.tsx`

```typescript
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    // Validate the invite token
    fetch(`/api/auth/accept-invite?token=${token}`, { method: "HEAD" })
      .catch(() => null);
    // For simplicity, we validate on submit. Show the form optimistically.
    setInviteValid(true);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to accept invite");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  }

  if (inviteValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Validating invite...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Join Your Team</h1>
          <p className="mt-2 text-sm text-slate-500">
            {companyName ? `You've been invited to join ${companyName}.` : "Set up your account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Set Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
              placeholder="8+ characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0070DD] disabled:opacity-60"
          >
            {loading ? "Setting up..." : "Accept Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/app/(crm)/api/auth/invite/ src/app/(crm)/api/auth/accept-invite/ src/app/(public)/invite/
git commit -m "feat: invite flow — send invite API, accept invite API + page"
```

---

### Task 8: Add company_id Filtering to All API Routes

This is the largest task. Every API route that queries a data table needs to:
1. Call `getSessionUser()` to get the authenticated user's `companyId`
2. Add `.eq('company_id', companyId)` to all SELECT/INSERT queries
3. Add `company_id` to all INSERT payloads

**Files:**
- Modify: All ~100 route files in `src/app/(crm)/api/`

**Pattern to apply to every route file:**

At the top of each route file, add the import:
```typescript
import { getSessionUser } from "@/lib/session";
```

Wrap each handler in a try/catch:
```typescript
export async function GET() {
  try {
    const session = await getSessionUser();
    // ... existing code, but add .eq('company_id', session.companyId) to queries
    // ... and add company_id: session.companyId to inserts
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 1: Create a helper script to identify all route files**

Run: `find src/app/\(crm\)/api -name "route.ts" -not -path "*/auth/*" -not -path "*/webhooks/*" -not -path "*/vapi/*" -not -path "*/chatbot/*" -not -path "*/marketing/track/*" -not -path "*/marketing/unsubscribe/*" | sort`

This gives you the exact list of files to modify. Exclude auth routes (they handle their own auth) and public webhook/Vapi routes.

- [ ] **Step 2: Apply the pattern to each route file**

For each file from Step 1:

1. Add `import { getSessionUser } from "@/lib/session";` (and `requireRole` if the route needs role checks per the permission table in the spec)
2. Wrap each handler (GET, POST, PATCH, DELETE) in `try { const session = await getSessionUser(); ... } catch (err) { if (err instanceof Response) return err; ... }`
3. Add `.eq('company_id', session.companyId)` to every `.from('tablename').select(...)` query
4. Add `company_id: session.companyId` to every `.from('tablename').insert({...})` payload
5. For routes that also accept role restrictions (per the permissions table), add `requireRole(session, [...])` after `getSessionUser()`

**Role restrictions by route prefix:**
- `/api/invoices/*` — `requireRole(session, ["owner", "admin", "manager"])`
- `/api/agents/*` — `requireRole(session, ["owner", "admin"])`
- `/api/marketing/*` (except track/unsubscribe) — `requireRole(session, ["owner", "admin", "manager"])`
- `/api/settings/*` — `requireRole(session, ["owner", "admin"])`
- All other data routes — all authenticated roles allowed

**Important:** The `logActivity()` and `logAudit()` helper functions in `src/lib/audit.ts` also need to accept and pass through `company_id`. Update those functions to accept an optional `company_id` parameter and include it in their insert payloads.

- [ ] **Step 3: Update `src/lib/audit.ts` to include company_id**

Add `company_id?: string` to the parameter objects of `logActivity()` and `logAudit()`, and include it in the Supabase insert calls.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`
Fix any type errors.

- [ ] **Step 5: Verify build passes**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 6: Commit**

```bash
git add src/app/(crm)/api/ src/lib/audit.ts
git commit -m "feat: add company_id filtering + role checks to all API routes"
```

---

### Task 9: Super-Admin Routes + Company Switcher

**Files:**
- Create: `src/app/(crm)/api/admin/companies/route.ts`
- Create: `src/app/(crm)/api/admin/companies/[id]/route.ts`
- Modify: `src/components/Sidebar.tsx` — add company switcher for super-admin

- [ ] **Step 1: Create admin companies list route**

File: `src/app/(crm)/api/admin/companies/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("*, user_count:users(count)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin company toggle route**

File: `src/app/(crm)/api/admin/companies/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("companies")
      .update({ is_active: body.is_active })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add company switcher to Sidebar**

In `src/components/Sidebar.tsx`, add a company switcher above the user section, only visible when `user?.is_super_admin` is true:

```typescript
{user?.is_super_admin && (
  <CompanySwitcher currentCompanyId={company?.id ?? ""} />
)}
```

Create an inline `CompanySwitcher` component (or add it directly in the Sidebar file):

```typescript
function CompanySwitcher({ currentCompanyId }: { currentCompanyId: string }) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function switchCompany(companyId: string) {
    document.cookie = `x-impersonate-company=${companyId};path=/;max-age=${60 * 60 * 24}`;
    window.location.reload();
  }

  async function clearImpersonation() {
    document.cookie = "x-impersonate-company=;path=/;max-age=0";
    window.location.reload();
  }

  return (
    <div className="border-b border-white/10 px-3 py-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Super Admin
      </p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-left text-xs text-white hover:bg-white/20"
      >
        {companies.find((c) => c.id === currentCompanyId)?.name ?? "Select company"}
      </button>
      {open && (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg bg-white/10">
          <button
            onClick={clearImpersonation}
            className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-white/10"
          >
            My Account (stop impersonating)
          </button>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => { switchCompany(c.id); setOpen(false); }}
              className={clsx(
                "w-full px-3 py-2 text-left text-xs text-white hover:bg-white/10",
                c.id === currentCompanyId && "bg-white/20"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

Note: `useState`, `useEffect` are already imported in Sidebar.tsx. You may need to add the `clsx` import if not already present.

- [ ] **Step 4: Verify TypeScript compiles and build passes**

Run: `npx tsc --noEmit 2>&1 | head -20`
Run: `npx next build 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add src/app/(crm)/api/admin/ src/components/Sidebar.tsx
git commit -m "feat: super-admin company list, toggle active, and sidebar company switcher"
```

---

### Task 10: Rewire Team Management to Users + Invites

**Files:**
- Modify: `src/components/settings/TeamMembers.tsx`
- Modify: `src/app/(crm)/settings/page.tsx` (the section that renders TeamMembers)

- [ ] **Step 1: Rewrite TeamMembers component**

Replace the entire contents of `src/components/settings/TeamMembers.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Plus, X, Mail, Clock, CheckCircle2 } from "lucide-react";
import type { AppUser, UserRole, Invite } from "@/lib/types";

interface TeamMembersProps {
  companyId: string;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "crew", label: "Crew" },
  { value: "sales_rep", label: "Sales Rep" },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";

export default function TeamMembers({ companyId }: TeamMembersProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("crew");
  const [sending, setSending] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch team users
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(() => {
        // Fetch users list from a team endpoint
        return fetch("/api/team-members");
      })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch pending invites
    fetch("/api/auth/invite")
      .then((r) => r.json())
      .then((data) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [companyId]);

  async function handleInvite() {
    if (!inviteEmail) return;
    setSending(true);
    setInviteUrl(null);

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setInviteUrl(data.invite_url);
      setInvites((prev) => [data.invite, ...prev]);
      setInviteEmail("");
      setInviteRole("crew");
    } catch {
      // Error handling
    } finally {
      setSending(false);
    }
  }

  const pendingInvites = invites.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-6">
      {/* Active team members */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">{users.length} team member{users.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1.5 rounded-lg bg-[#0085FF] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0070DD]"
          >
            {showInvite ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showInvite ? "Cancel" : "Invite Member"}
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={inputClass}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className={inputClass}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={sending || !inviteEmail}
              className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0070DD] disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {sending ? "Sending..." : "Send Invite"}
            </button>
            {inviteUrl && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Invite created. Share this link: <code className="font-mono text-xs">{window.location.origin}{inviteUrl}</code>
              </div>
            )}
          </div>
        )}

        {/* Team list */}
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                {u.role.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Pending Invites</p>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-700">{inv.email}</p>
                    <p className="text-xs text-slate-500">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium capitalize text-amber-700">
                  {inv.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update Settings page to pass companyId**

In `src/app/(crm)/settings/page.tsx`, find where `<TeamMembers` is rendered. The current props are `members`, `onAdd`, `onDeactivate`. Replace with:

```typescript
<TeamMembers companyId={""} />
```

The component now fetches its own data. Remove the `members`, `onAdd`, `onDeactivate` state management from the settings page that was feeding the old TeamMembers component.

- [ ] **Step 3: Update the team-members API route to query users table**

Replace `src/app/(crm)/api/team-members/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSessionUser();

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("company_id", session.companyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles and build passes**

Run: `npx tsc --noEmit 2>&1 | head -20`
Run: `npx next build 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/TeamMembers.tsx src/app/(crm)/settings/page.tsx src/app/(crm)/api/team-members/route.ts
git commit -m "feat: rewire team management from team_members to users + invite flow"
```

---

### Task 11: Final Build Verification + Root Redirect

**Files:**
- Modify: `src/app/page.tsx` (if it exists) or create a root redirect

- [ ] **Step 1: Ensure root `/` redirects to `/dashboard`**

Check if `src/app/page.tsx` exists at the root. If it does, replace its contents. If not, create it:

```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 2: Full TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Full production build**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds with all routes compiling

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "feat: root redirect + final build verification for user management"
```

---

## Execution Notes

- **Task 8 is the heaviest lift** — 100 API route files need the `getSessionUser()` + `company_id` pattern. This is mechanical but large. Best dispatched to an agent that can process files in batch.
- **Migration 006 must be run against the Supabase project** after the code is deployed. It's non-destructive (adds columns, doesn't modify existing data).
- **After migration**, existing data will have `company_id = NULL`. A follow-up seed script should create a default company for The Finishing Touch and backfill all existing rows.
- **`SUPABASE_SERVICE_ROLE_KEY`** must be added to the `.env` file for the admin client to work.
