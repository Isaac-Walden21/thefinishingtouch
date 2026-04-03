import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/settings/data/export — export all CRM data as JSON
export async function POST() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  try {
    const [customers, leads, activities, invoices, payments, estimates, events] =
      await Promise.all([
        supabaseAdmin.from("customers").select("*").eq("company_id", session.companyId).is("archived_at", null),
        supabaseAdmin.from("leads").select("*").eq("company_id", session.companyId),
        supabaseAdmin.from("activities").select("*").eq("company_id", session.companyId),
        supabaseAdmin.from("invoices").select("*").eq("company_id", session.companyId),
        supabaseAdmin.from("payments").select("*").eq("company_id", session.companyId),
        supabaseAdmin.from("estimates").select("*").eq("company_id", session.companyId),
        supabaseAdmin.from("calendar_events").select("*").eq("company_id", session.companyId),
      ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      customers: customers.data ?? [],
      leads: leads.data ?? [],
      activities: activities.data ?? [],
      invoices: invoices.data ?? [],
      payments: payments.data ?? [],
      estimates: estimates.data ?? [],
      calendar_events: events.data ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="tft-crm-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
