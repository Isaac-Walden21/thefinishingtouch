import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// POST /api/estimates/[id]/duplicate — clone an estimate
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data: original } = await supabaseAdmin
    .from("estimates").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!original) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const { data: clone, error } = await supabaseAdmin
    .from("estimates").insert({
      company_id: session.companyId,
      customer_id: original.customer_id,
      customer_name: original.customer_name,
      status: "draft",
      project_type: original.project_type,
      dimensions: original.dimensions,
      materials: original.materials,
      complexity: original.complexity,
      options: original.options,
      line_items: original.line_items,
      subtotal: original.subtotal,
      margin: original.margin,
      total: original.total,
      timeline: original.timeline,
      notes: original.notes,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(clone, { status: 201 });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
