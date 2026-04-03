import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { syncAllUnsynced } from "@/lib/quickbooks";
import { logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/invoices/qb-sync -- push unsynced invoices to QuickBooks
export async function POST() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

    const { data: invoices, error } = await supabaseAdmin
      .from("invoices")
      .select("*, customer:customers(name, email)")
      .eq("company_id", session.companyId)
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

    const result = await syncAllUnsynced(session.companyId, mapped);

    await logAudit({
      company_id: session.companyId,
      action: "qb_sync",
      category: "integrations",
      new_value: {
        synced: result.synced,
        errors: result.errors.length,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
