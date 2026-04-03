import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/agents/resume-all — resume all paused agents
export async function POST() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { data, error } = await supabaseAdmin
    .from("ai_agents")
    .update({ status: "active" })
    .eq("status", "paused")
    .select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
      company_id: session.companyId,
    action: "agents_resumed_all",
    category: "agents",
    new_value: { resumed_count: data?.length ?? 0 },
  });

  return NextResponse.json({
    success: true,
    resumed_count: data?.length ?? 0,
    agents: data,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
