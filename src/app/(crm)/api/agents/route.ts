import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// GET /api/agents — list all AI agents
export async function GET() {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/agents — create a new AI agent
export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      name: body.name,
      type: body.type ?? "general",
      status: body.status ?? "active",
      description: body.description ?? null,
      config: body.config ?? {},
      trigger: body.trigger ?? null,
      schedule: body.schedule ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "agent_created",
    category: "agents",
    entity_type: "ai_agent",
    entity_id: data.id,
    new_value: data as Record<string, unknown>,
  });

  return NextResponse.json(data, { status: 201 });
}
