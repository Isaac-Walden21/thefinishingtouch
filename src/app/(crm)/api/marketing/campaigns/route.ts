import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/marketing/campaigns — list campaigns
export async function GET() {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
