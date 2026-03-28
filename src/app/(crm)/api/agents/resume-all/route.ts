import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// POST /api/agents/resume-all — resume all paused agents
export async function POST() {
  const { data, error } = await supabase
    .from("ai_agents")
    .update({ status: "active" })
    .eq("status", "paused")
    .select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "agents_resumed_all",
    category: "agents",
    new_value: { resumed_count: data?.length ?? 0 },
  });

  return NextResponse.json({
    success: true,
    resumed_count: data?.length ?? 0,
    agents: data,
  });
}
