import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";

// POST /api/estimates/[id]/convert — convert estimate to invoice
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  if (!estimate.customer_id) {
    return NextResponse.json(
      { error: "Estimate must have a customer_id to convert to invoice" },
      { status: 400 }
    );
  }

  // Map estimate line items to invoice line items
  const invoiceLineItems = (estimate.line_items as Array<{
    description: string;
    quantity: number;
    unit_cost: number;
    total: number;
  }>).map((item) => ({
    id: crypto.randomUUID(),
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_cost,
    total: item.total,
  }));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: estimate.customer_id,
      estimate_id: id,
      status: "draft",
      line_items: invoiceLineItems,
      subtotal: estimate.subtotal,
      tax_rate: 0.07,
      tax_amount: Number(estimate.subtotal) * 0.07,
      total: Number(estimate.subtotal) * 1.07,
      notes: estimate.notes,
      due_date: dueDate.toISOString().split("T")[0],
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update estimate status
  await supabase
    .from("estimates")
    .update({ status: "accepted" })
    .eq("id", id);

  await logActivity({
    customer_id: estimate.customer_id,
    type: "quote",
    description: `Estimate converted to invoice ${invoice.invoice_number}`,
  });

  return NextResponse.json(invoice, { status: 201 });
}
