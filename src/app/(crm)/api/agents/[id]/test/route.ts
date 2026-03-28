import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email";

// POST /api/agents/[id]/test — send a test message from an agent
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { test_email } = body as { test_email: string };

  if (!test_email) {
    return NextResponse.json(
      { error: "test_email is required" },
      { status: 400 }
    );
  }

  const { data: agent } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Get the agent's template
  const { data: template } = await supabase
    .from("agent_templates")
    .select("*")
    .eq("agent_id", id)
    .limit(1)
    .single();

  const subject = template?.subject ?? `[TEST] ${agent.name} Message`;
  const messageBody = template?.body ?? (agent.config as Record<string, unknown>)?.message_template ?? "This is a test message from your AI agent.";

  const result = await sendEmail(
    test_email,
    `[TEST] ${subject}`,
    `
      <div style="background:#fef3c7;padding:12px;border-radius:6px;margin-bottom:16px;">
        <strong>This is a test message</strong> from the "${agent.name}" agent.
      </div>
      ${messageBody}
      <p style="margin-top:24px;color:#999;font-size:0.85em;">
        Sent by ${agent.name} (${agent.type}) in test mode.
      </p>
    `
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Test message sent to ${test_email}`,
    agent: agent.name,
  });
}
