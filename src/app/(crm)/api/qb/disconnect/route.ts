import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";

// POST /api/qb/disconnect -- disconnect QuickBooks from the company
export async function POST() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        qb_realm_id: null,
        qb_access_token: null,
        qb_refresh_token: null,
        qb_token_expires_at: null,
      })
      .eq("id", session.companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      company_id: session.companyId,
      action: "quickbooks_disconnected",
      category: "integrations",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
