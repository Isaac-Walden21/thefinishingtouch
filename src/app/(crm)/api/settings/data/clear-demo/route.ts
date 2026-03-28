import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// POST /api/settings/data/clear-demo — clear demo/seed data
export async function POST(request: Request) {
  const body = await request.json();
  const { confirm } = body as { confirm: boolean };

  if (!confirm) {
    return NextResponse.json(
      { error: "Set confirm: true to clear demo data" },
      { status: 400 }
    );
  }

  try {
    // Delete in dependency order (children first)
    await supabase.from("campaign_recipients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("automation_enrollments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("vision_annotations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("vision_shares").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("vision_iterations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("vision_projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("invoice_splits").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("invoice_views").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("estimate_approvals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("estimate_revisions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("estimate_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("agent_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("agent_actions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("referrals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("estimates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("calendar_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("customer_tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("marketing_contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("campaigns").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("automations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("email_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ai_agents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    await logAudit({
      action: "demo_data_cleared",
      category: "system",
    });

    return NextResponse.json({
      success: true,
      message: "All demo data has been cleared",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Clear failed" },
      { status: 500 }
    );
  }
}
