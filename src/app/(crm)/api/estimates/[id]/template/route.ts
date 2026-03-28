import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/estimates/[id]/template — save estimate as a reusable template
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, created_by } = body as { name?: string; created_by?: string };

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const templateName = name ?? `${estimate.project_type} Template`;

  const { data: template, error } = await supabase
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
}
