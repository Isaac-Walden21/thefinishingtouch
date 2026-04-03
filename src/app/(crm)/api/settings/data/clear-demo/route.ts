import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/settings/data/clear-demo — clear demo/seed data
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

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
    await supabaseAdmin.from("campaign_recipients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("automation_enrollments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("vision_annotations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("vision_shares").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("vision_iterations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("vision_projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("invoice_splits").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("invoice_views").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("estimate_approvals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("estimate_revisions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("estimate_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("agent_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("agent_actions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("referrals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("estimates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("calendar_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("customer_tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("marketing_contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("campaigns").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("automations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("email_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("ai_agents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    await logAudit({
      company_id: session.companyId,
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

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
