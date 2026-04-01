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
