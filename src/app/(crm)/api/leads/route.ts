import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit, logActivity } from "@/lib/audit";

// GET /api/leads — list all leads with customer join
export async function GET() {
  const { data, error } = await supabase
    .from("leads")
    .select("*, customer:customers(id, name, email, phone)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/leads — create a new lead
export async function POST(request: Request) {
  const body = await request.json();

  if (!body.customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      customer_id: body.customer_id,
      status: body.status ?? "new",
      source: body.source ?? null,
      service_type: body.service_type ?? null,
      estimated_value: body.estimated_value ?? null,
      notes: body.notes ?? null,
      assigned_to: body.assigned_to ?? null,
      priority: body.priority ?? "medium",
      follow_up_date: body.follow_up_date ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "lead_created",
    category: "leads",
    entity_type: "lead",
    entity_id: data.id,
    new_value: data as Record<string, unknown>,
  });

  await logActivity({
    lead_id: data.id,
    customer_id: body.customer_id,
    type: "note",
    description: "Lead created",
  });

  return NextResponse.json(data, { status: 201 });
}
