import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/team-members — list active team members
export async function GET() {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
