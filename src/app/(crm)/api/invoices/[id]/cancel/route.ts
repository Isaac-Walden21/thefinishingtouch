import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity, logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/invoices/[id]/cancel — void an invoice
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;

  const { data: invoice } = await supabaseAdmin
    .from("invoices").select("*").eq("company_id", session.companyId)
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

  const { error } = await supabaseAdmin
    .from("invoices")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
      company_id: session.companyId,
    action: "invoice_cancelled",
    category: "invoices",
    entity_type: "invoice",
    entity_id: id,
    old_value: { status: invoice.status },
    new_value: { status: "cancelled" },
  });

  await logActivity({
      company_id: session.companyId,
    customer_id: invoice.customer_id,
    type: "note",
    description: `Invoice ${invoice.invoice_number} cancelled`,
  });

  return NextResponse.json({ success: true, id });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
