import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// POST /api/estimates/[id]/template — save estimate as a reusable template
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;
  const body = await request.json();
  const { name, created_by } = body as { name?: string; created_by?: string };

  const { data: estimate } = await supabaseAdmin
    .from("estimates").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const templateName = name ?? `${estimate.project_type} Template`;

  const { data: template, error } = await supabaseAdmin
    .from("estimate_templates")
    .insert({
      name: templateName,
      line_items: estimate.line_items,
      materials: estimate.materials,
      options: estimate.options,
      margin: estimate.margin,
      terms: estimate.notes,
      created_by: created_by ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(template, { status: 201 });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
