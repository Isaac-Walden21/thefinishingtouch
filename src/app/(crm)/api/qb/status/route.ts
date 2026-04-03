import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/qb/status -- get QuickBooks connection status for the company
export async function GET() {
  try {
    const session = await getSessionUser();

    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .select("qb_realm_id, qb_token_expires_at")
      .eq("id", session.companyId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const connected = !!company?.qb_realm_id;

    return NextResponse.json({
      connected,
      status: connected ? "connected" : "disconnected",
      last_activity: company?.qb_token_expires_at ?? null,
      realm_id: company?.qb_realm_id ?? null,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
