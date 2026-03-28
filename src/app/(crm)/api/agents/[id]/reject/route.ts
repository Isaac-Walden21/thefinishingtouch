import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/agents/[id]/reject — reject a pending agent action
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action_id } = body as { action_id: string };

  if (!action_id) {
    return NextResponse.json(
      { error: "action_id is required" },
      { status: 400 }
    );
  }

  const { data: action } = await supabase
    .from("agent_actions")
    .select("id")
    .eq("id", action_id)
    .eq("agent_id", id)
    .eq("status", "pending_approval")
    .single();

  if (!action) {
    return NextResponse.json(
      { error: "Pending action not found" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("agent_actions")
    .update({ status: "failed" })
    .eq("id", action_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, action_id });
}
