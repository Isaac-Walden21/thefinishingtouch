import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { refreshToken, syncAllUnsynced } from "@/lib/quickbooks";
import { logAudit } from "@/lib/audit";

// POST /api/invoices/qb-sync — push unsynced invoices to QuickBooks
export async function POST() {
  try {
    // Get a fresh access token
    const tokens = await refreshToken();

    // Get all paid/sent invoices that haven't been synced
    // We track sync via the integrations table
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*, customer:customers(name, email)")
      .in("status", ["sent", "paid", "partial"])
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invoices?.length) {
      return NextResponse.json({ synced: 0, message: "No invoices to sync" });
    }

    const mapped = invoices.map((inv) => ({
      id: inv.id,
      customer_name: inv.customer?.name ?? "Unknown",
      customer_email: inv.customer?.email,
      line_items: inv.line_items as Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
      }>,
      due_date: inv.due_date,
      invoice_number: inv.invoice_number,
      notes: inv.notes,
    }));

    const result = await syncAllUnsynced(tokens.access_token, mapped);

    await logAudit({
      action: "qb_sync",
      category: "integrations",
      new_value: {
        synced: result.synced,
        errors: result.errors.length,
      },
    });

    // Update integration last_activity
    await supabase
      .from("integrations")
      .upsert(
        {
          provider: "quickbooks",
          status: result.errors.length === 0 ? "connected" : "error",
          last_activity: new Date().toISOString(),
        },
        { onConflict: "provider" }
      );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "QuickBooks sync failed" },
      { status: 500 }
    );
  }
}
