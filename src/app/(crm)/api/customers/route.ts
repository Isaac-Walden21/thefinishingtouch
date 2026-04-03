import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit, logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// GET /api/customers — list all non-archived customers
export async function GET() {
  try {
    const session = await getSessionUser();

  const { data, error } = await supabaseAdmin
    .from("customers").select("*").eq("company_id", session.companyId)
    .is("archived_at", null)
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

// POST /api/customers — create a new customer
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

  const body = await request.json();

  if (!body.name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("customers").insert({
      company_id: session.companyId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      service_type: body.service_type ?? null,
      source: body.source ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
      company_id: session.companyId,
    action: "customer_created",
    category: "customers",
    entity_type: "customer",
    entity_id: data.id,
    new_value: data as Record<string, unknown>,
  });

  await logActivity({
      company_id: session.companyId,
    customer_id: data.id,
    type: "note",
    description: `Customer "${data.name}" created`,
  });

  return NextResponse.json(data, { status: 201 });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
