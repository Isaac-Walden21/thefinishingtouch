import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/invoices/export — QuickBooks-compatible CSV export
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabaseAdmin
    .from("invoices").select("*, customer:customers(name, email)").eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: invoices, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "InvoiceNo", "Customer", "Email", "InvoiceDate", "DueDate",
    "ItemDescription", "Quantity", "Rate", "Amount",
    "Subtotal", "TaxRate", "Tax", "Total", "Status", "PaidDate", "PaymentMethod",
  ];

  const rows: string[][] = [];
  for (const inv of invoices ?? []) {
    const items = (inv.line_items as Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>) ?? [];

    if (items.length === 0) {
      rows.push([
        inv.invoice_number, esc(inv.customer?.name ?? ""), esc(inv.customer?.email ?? ""),
        inv.created_at.split("T")[0], inv.due_date,
        "", "0", "0", "0",
        String(inv.subtotal), String(inv.tax_rate), String(inv.tax_amount),
        String(inv.total), inv.status, inv.paid_at?.split("T")[0] ?? "", inv.payment_method ?? "",
      ]);
    } else {
      for (const item of items) {
        rows.push([
          inv.invoice_number, esc(inv.customer?.name ?? ""), esc(inv.customer?.email ?? ""),
          inv.created_at.split("T")[0], inv.due_date,
          esc(item.description), String(item.quantity), String(item.unit_price), String(item.total),
          String(inv.subtotal), String(inv.tax_rate), String(inv.tax_amount),
          String(inv.total), inv.status, inv.paid_at?.split("T")[0] ?? "", inv.payment_method ?? "",
        ]);
      }
    }
  }

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function esc(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
