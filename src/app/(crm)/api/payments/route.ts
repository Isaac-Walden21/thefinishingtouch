import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/payments — list payments with optional invoice_id filter
export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoice_id");

  let query = supabaseAdmin
    .from("payments").select("*").eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (invoiceId) {
    query = query.eq("invoice_id", invoiceId);
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
