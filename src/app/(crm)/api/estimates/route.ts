import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// GET /api/estimates — list all estimates
export async function GET() {
  try {
    const session = await getSessionUser();

  const { data, error } = await supabaseAdmin
    .from("estimates").select("*, customer:customers(id, name, email, phone)").eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/estimates — create a new estimate
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

  const body = await request.json();

  const {
    customer_id,
    customer_name,
    project_type,
    dimensions,
    materials,
    complexity,
    options,
    line_items,
    subtotal,
    margin,
    total,
    timeline,
    notes,
  } = body;

  if (!customer_name || !project_type) {
    return NextResponse.json(
      { error: "customer_name and project_type are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("estimates").insert({
      company_id: session.companyId,
      customer_id: customer_id ?? null,
      customer_name,
      project_type,
      dimensions: dimensions ?? {},
      materials: materials ?? [],
      complexity: complexity ?? "moderate",
      options: options ?? {},
      line_items: line_items ?? [],
      subtotal: subtotal ?? 0,
      margin: margin ?? 0.35,
      total: total ?? 0,
      timeline: timeline ?? null,
      notes: notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      company_id: session.companyId,
    customer_id: customer_id ?? null,
    type: "quote",
    description: `Estimate created for ${project_type} — $${total ?? 0}`,
  });

  return NextResponse.json(data, { status: 201 });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
