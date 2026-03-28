import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";

// POST /api/invoices/[id]/split — create deposit/final split
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { split_percentage } = body as { split_percentage?: number };

  const pct = split_percentage ?? 50;
  if (pct <= 0 || pct >= 100) {
    return NextResponse.json(
      { error: "split_percentage must be between 1 and 99" },
      { status: 400 }
    );
  }

  const { data: parent } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (!parent) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (parent.status !== "draft") {
    return NextResponse.json(
      { error: "Can only split draft invoices" },
      { status: 400 }
    );
  }

  const depositAmount = Number(parent.total) * (pct / 100);
  const finalAmount = Number(parent.total) - depositAmount;
  const depositTax = Number(parent.tax_amount) * (pct / 100);
  const finalTax = Number(parent.tax_amount) - depositTax;
  const depositSubtotal = Number(parent.subtotal) * (pct / 100);
  const finalSubtotal = Number(parent.subtotal) - depositSubtotal;

  // Create deposit invoice
  const { data: deposit, error: depError } = await supabase
    .from("invoices")
    .insert({
      customer_id: parent.customer_id,
      lead_id: parent.lead_id,
      estimate_id: parent.estimate_id,
      status: "draft",
      line_items: [
        {
          id: crypto.randomUUID(),
          description: `Deposit (${pct}%) — ${parent.invoice_number}`,
          quantity: 1,
          unit_price: depositSubtotal,
          total: depositSubtotal,
        },
      ],
      subtotal: depositSubtotal,
      tax_rate: parent.tax_rate,
      tax_amount: depositTax,
      total: depositAmount,
      notes: `Deposit for invoice ${parent.invoice_number}`,
      due_date: parent.due_date,
    })
    .select("*")
    .single();

  if (depError) {
    return NextResponse.json({ error: depError.message }, { status: 500 });
  }

  // Create final invoice
  const finalDue = new Date(parent.due_date);
  finalDue.setDate(finalDue.getDate() + 30);

  const { data: final, error: finError } = await supabase
    .from("invoices")
    .insert({
      customer_id: parent.customer_id,
      lead_id: parent.lead_id,
      estimate_id: parent.estimate_id,
      status: "draft",
      line_items: [
        {
          id: crypto.randomUUID(),
          description: `Final balance (${100 - pct}%) — ${parent.invoice_number}`,
          quantity: 1,
          unit_price: finalSubtotal,
          total: finalSubtotal,
        },
      ],
      subtotal: finalSubtotal,
      tax_rate: parent.tax_rate,
      tax_amount: finalTax,
      total: finalAmount,
      notes: `Final balance for invoice ${parent.invoice_number}`,
      due_date: finalDue.toISOString().split("T")[0],
    })
    .select("*")
    .single();

  if (finError) {
    return NextResponse.json({ error: finError.message }, { status: 500 });
  }

  // Create split record
  await supabase.from("invoice_splits").insert({
    parent_invoice_id: id,
    deposit_invoice_id: deposit.id,
    final_invoice_id: final.id,
    split_percentage: pct,
  });

  // Cancel original
  await supabase
    .from("invoices")
    .update({ status: "cancelled" })
    .eq("id", id);

  await logActivity({
    customer_id: parent.customer_id,
    type: "note",
    description: `Invoice ${parent.invoice_number} split into deposit (${pct}%) and final (${100 - pct}%)`,
  });

  return NextResponse.json({
    success: true,
    deposit: deposit,
    final: final,
    split_percentage: pct,
  });
}
