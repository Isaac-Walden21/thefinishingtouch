import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/agents — list all AI agents
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { data, error } = await supabaseAdmin
    .from("ai_agents").select("*").eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/agents — create a new AI agent
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const body = await request.json();

  if (!body.name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("ai_agents").insert({
      company_id: session.companyId,
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
      company_id: session.companyId,
    action: "agent_created",
    category: "agents",
    entity_type: "ai_agent",
    entity_id: data.id,
    new_value: data as Record<string, unknown>,
  });

  return NextResponse.json(data, { status: 201 });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
