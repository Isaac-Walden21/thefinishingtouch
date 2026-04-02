import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/activities — list activities with optional customer_id/lead_id filter
export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const leadId = searchParams.get("lead_id");

  let query = supabaseAdmin
    .from("activities").select("*").eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  if (leadId) {
    query = query.eq("lead_id", leadId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
