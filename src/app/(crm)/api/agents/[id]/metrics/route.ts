import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/agents/[id]/metrics — performance metrics for an agent
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: agent } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Get action counts by status
  const { data: actions } = await supabase
    .from("agent_actions")
    .select("status, action_type, created_at")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  const allActions = actions ?? [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const actionsToday = allActions.filter(
    (a) => new Date(a.created_at) >= todayStart
  ).length;
  const actionsThisWeek = allActions.filter(
    (a) => new Date(a.created_at) >= weekStart
  ).length;
  const actionsThisMonth = allActions.filter(
    (a) => new Date(a.created_at) >= monthStart
  ).length;

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const a of allActions) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    byType[a.action_type] = (byType[a.action_type] ?? 0) + 1;
  }

  const completedCount = byStatus["completed"] ?? 0;
  const failedCount = byStatus["failed"] ?? 0;
  const successRate =
    completedCount + failedCount > 0
      ? Math.round((completedCount / (completedCount + failedCount)) * 100)
      : 100;

  return NextResponse.json({
    agent_id: id,
    agent_name: agent.name,
    status: agent.status,
    last_run: agent.last_run,
    total_actions: allActions.length,
    actions_today: actionsToday,
    actions_this_week: actionsThisWeek,
    actions_this_month: actionsThisMonth,
    by_status: byStatus,
    by_type: byType,
    success_rate: successRate,
    recent_actions: allActions.slice(0, 10),
  });
}
