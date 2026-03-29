import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/marketing/templates — list email templates
export async function GET() {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
