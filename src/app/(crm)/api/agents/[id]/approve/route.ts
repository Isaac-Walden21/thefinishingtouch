import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/agents/[id]/approve — approve a pending agent action
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { id } = await params;
  const body = await request.json();
  const { action_id } = body as { action_id: string };

  if (!action_id) {
    return NextResponse.json(
      { error: "action_id is required" },
      { status: 400 }
    );
  }

  const { data: action } = await supabaseAdmin
    .from("agent_actions")
    .select("*")
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

  const { error } = await supabaseAdmin
    .from("agent_actions")
    .update({ status: "completed" })
    .eq("id", action_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      company_id: session.companyId,
    customer_id: action.customer_id,
    lead_id: action.lead_id,
    type: "ai_action",
    description: `Agent action approved: ${action.description}`,
  });

  return NextResponse.json({ success: true, action_id });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
