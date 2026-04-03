import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/invoices/[id] — get single invoice with customer join
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("invoices").select("*, customer:customers(id, name, email, phone, address, city, state, zip)").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] — update invoice
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;
  const body = await request.json();

  const allowed = [
    "status", "invoice_number", "issue_date", "due_date",
    "line_items", "subtotal", "tax_rate", "tax_amount",
    "discount", "total", "notes", "terms", "payment_terms",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Fetch old values for audit
  const { data: old } = await supabaseAdmin
    .from("invoices").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!old) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
      company_id: session.companyId,
    action: "invoice_updated",
    category: "invoices",
    entity_type: "invoice",
    entity_id: id,
    old_value: old as Record<string, unknown>,
    new_value: updates,
  });

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
