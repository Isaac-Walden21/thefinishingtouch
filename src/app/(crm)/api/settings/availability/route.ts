import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/settings/availability — get availability rules
export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { searchParams } = new URL(request.url);
  const teamMemberId = searchParams.get("team_member_id");

  let query = supabaseAdmin
    .from("availability_rules").select("*, team_member:team_members(id, name)").eq("company_id", session.companyId)
    .order("day_of_week");

  if (teamMemberId) {
    query = query.eq("team_member_id", teamMemberId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings/availability — update availability rules
export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

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
    await supabaseAdmin
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

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
