import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/settings/data/export — export all CRM data as JSON
export async function POST() {
  try {
    const [customers, leads, activities, invoices, payments, estimates, events] =
      await Promise.all([
        supabase.from("customers").select("*").is("archived_at", null),
        supabase.from("leads").select("*"),
        supabase.from("activities").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("estimates").select("*"),
        supabase.from("calendar_events").select("*"),
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
}
