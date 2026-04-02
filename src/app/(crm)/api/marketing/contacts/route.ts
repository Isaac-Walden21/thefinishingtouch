import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/marketing/contacts — list marketing contacts
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { data, error } = await supabaseAdmin
    .from("marketing_contacts").select("*").eq("company_id", session.companyId)
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
