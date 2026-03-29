import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/marketing/contacts — list marketing contacts
export async function GET() {
  const { data, error } = await supabase
    .from("marketing_contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
