import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/payments — list payments with optional invoice_id filter
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoice_id");

  let query = supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (invoiceId) {
    query = query.eq("invoice_id", invoiceId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
