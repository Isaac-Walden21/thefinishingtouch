import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/settings/availability — get availability rules
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamMemberId = searchParams.get("team_member_id");

  let query = supabase
    .from("availability_rules")
    .select("*, team_member:team_members(id, name)")
    .order("day_of_week");

  if (teamMemberId) {
    query = query.eq("team_member_id", teamMemberId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/settings/availability — update availability rules
export async function PUT(request: Request) {
  const body = await request.json();
  const { team_member_id, rules } = body as {
    team_member_id: string;
    rules: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_enabled: boolean;
    }>;
  };

  if (!team_member_id || !rules?.length) {
    return NextResponse.json(
      { error: "team_member_id and rules array are required" },
      { status: 400 }
    );
  }

  for (const rule of rules) {
    await supabase
      .from("availability_rules")
      .upsert(
        {
          team_member_id,
          day_of_week: rule.day_of_week,
          start_time: rule.start_time,
          end_time: rule.end_time,
          is_enabled: rule.is_enabled,
        },
        { onConflict: "team_member_id,day_of_week" }
      );
  }

  return NextResponse.json({ success: true, updated: rules.length });
}
