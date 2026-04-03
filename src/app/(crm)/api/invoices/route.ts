import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit, logActivity } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/invoices — list all invoices with customer join
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { data, error } = await supabaseAdmin
    .from("invoices").select("*, customer:customers(id, name, email, phone)").eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/invoices — create a new invoice
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const body = await request.json();

  if (!body.customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("invoices").insert({
      company_id: session.companyId,
      customer_id: body.customer_id,
      estimate_id: body.estimate_id ?? null,
      invoice_number: body.invoice_number,
      status: body.status ?? "draft",
      issue_date: body.issue_date ?? new Date().toISOString(),
      due_date: body.due_date,
      line_items: body.line_items ?? [],
      subtotal: body.subtotal ?? 0,
      tax_rate: body.tax_rate ?? 0,
      tax_amount: body.tax_amount ?? 0,
      discount: body.discount ?? 0,
      total: body.total ?? 0,
      notes: body.notes ?? null,
      terms: body.terms ?? null,
      payment_terms: body.payment_terms ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
      company_id: session.companyId,
    action: "invoice_created",
    category: "invoices",
    entity_type: "invoice",
    entity_id: data.id,
    new_value: data as Record<string, unknown>,
  });

  await logActivity({
      company_id: session.companyId,
    customer_id: body.customer_id,
    type: "note",
    description: `Invoice ${data.invoice_number ?? data.id} created`,
  });

  return NextResponse.json(data, { status: 201 });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
