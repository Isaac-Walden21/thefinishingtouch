import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// POST /api/agents/pause-all — kill switch: pause all agents
export async function POST() {
  const { data, error } = await supabase
    .from("ai_agents")
    .update({ status: "paused" })
    .eq("status", "active")
    .select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "agents_paused_all",
    category: "agents",
    new_value: { paused_count: data?.length ?? 0 },
  });

  return NextResponse.json({
    success: true,
    paused_count: data?.length ?? 0,
    agents: data,
  });
}
