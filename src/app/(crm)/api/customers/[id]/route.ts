import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit, logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// PATCH /api/customers/[id] — inline edit customer
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;
  const body = await request.json();

  // Only allow updating known fields
  const allowed = ["name", "email", "phone", "address", "city", "state", "zip", "service_type", "source", "notes", "tags"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Fetch old values for audit
  const { data: old } = await supabaseAdmin
    .from("customers").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!old) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
      company_id: session.companyId,
    action: "customer_updated",
    category: "customers",
    entity_type: "customer",
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

// DELETE /api/customers/[id] — archive customer (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("customers")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  await logActivity({
      company_id: session.companyId,
    customer_id: id,
    type: "note",
    description: "Customer archived",
  });

  return NextResponse.json({ success: true, id: data.id });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
