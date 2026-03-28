import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/invoices/[id]/views — get view tracking data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("invoice_views")
    .select("*")
    .eq("invoice_id", id)
    .order("viewed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    views: data,
    total_views: data?.length ?? 0,
    first_viewed: data?.length ? data[data.length - 1].viewed_at : null,
    last_viewed: data?.length ? data[0].viewed_at : null,
  });
}
