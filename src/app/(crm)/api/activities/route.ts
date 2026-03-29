import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/activities — list activities with optional customer_id/lead_id filter
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const leadId = searchParams.get("lead_id");

  let query = supabase
    .from("activities")
    .select("*")
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
}
