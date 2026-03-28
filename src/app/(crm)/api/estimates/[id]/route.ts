import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// PATCH /api/estimates/[id] — update estimate
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const allowed = [
    "customer_id", "customer_name", "status", "project_type", "dimensions",
    "materials", "complexity", "options", "line_items", "subtotal",
    "margin", "total", "timeline", "notes",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Save revision before update
  const { data: current } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Get next revision number
  const { count } = await supabase
    .from("estimate_revisions")
    .select("*", { count: "exact", head: true })
    .eq("estimate_id", id);

  await supabase.from("estimate_revisions").insert({
    estimate_id: id,
    revision_number: (count ?? 0) + 1,
    snapshot: current,
    created_by: body.created_by ?? null,
  });

  const { data, error } = await supabase
    .from("estimates")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "estimate_updated",
    category: "estimates",
    entity_type: "estimate",
    entity_id: id,
    old_value: current as Record<string, unknown>,
    new_value: updates,
  });

  return NextResponse.json(data);
}
