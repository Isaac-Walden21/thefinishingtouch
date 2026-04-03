import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/invoices/[id]/mark-paid — record a manual payment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;
  const body = await request.json();
  const { method, amount, notes } = body as {
    method: "cash" | "check" | "other";
    amount?: number;
    notes?: string;
  };

  if (!method) {
    return NextResponse.json(
      { error: "payment method is required" },
      { status: 400 }
    );
  }

  const { data: invoice } = await supabaseAdmin
    .from("invoices").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const paymentAmount = amount ?? Number(invoice.total);

  // Create payment record
  const { error: payError } = await supabaseAdmin.from("payments").insert({
      company_id: session.companyId,
    invoice_id: id,
    amount: paymentAmount,
    method,
    notes: notes ?? null,
  });

  if (payError) {
    return NextResponse.json({ error: payError.message }, { status: 500 });
  }

  // Check total payments to determine status
  const { data: allPayments } = await supabaseAdmin
    .from("payments").select("amount").eq("company_id", session.companyId)
    .eq("invoice_id", id);

  const totalPaid = (allPayments ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const newStatus = totalPaid >= Number(invoice.total) ? "paid" : "partial";

  await supabaseAdmin
    .from("invoices")
    .update({
      status: newStatus,
      paid_at: newStatus === "paid" ? new Date().toISOString() : invoice.paid_at,
      payment_method: method,
    })
    .eq("id", id);

  await logActivity({
      company_id: session.companyId,
    customer_id: invoice.customer_id,
    type: "payment",
    description: `Manual payment of $${paymentAmount.toLocaleString()} (${method}) recorded for invoice ${invoice.invoice_number}`,
  });

  return NextResponse.json({
    success: true,
    status: newStatus,
    total_paid: totalPaid,
    remaining: Number(invoice.total) - totalPaid,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
