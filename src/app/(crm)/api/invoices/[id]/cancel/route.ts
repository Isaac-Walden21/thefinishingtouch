import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, logAudit } from "@/lib/audit";

// POST /api/invoices/[id]/cancel — void an invoice
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Cannot cancel a paid invoice" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("invoices")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "invoice_cancelled",
    category: "invoices",
    entity_type: "invoice",
    entity_id: id,
    old_value: { status: invoice.status },
    new_value: { status: "cancelled" },
  });

  await logActivity({
    customer_id: invoice.customer_id,
    type: "note",
    description: `Invoice ${invoice.invoice_number} cancelled`,
  });

  return NextResponse.json({ success: true, id });
}
