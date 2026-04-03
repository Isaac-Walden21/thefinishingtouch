import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// POST /api/vision/[id]/save — save vision project to customer record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;
  const body = await request.json();
  const { customer_id } = body as { customer_id: string };

  if (!customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  // Verify customer exists
  const { data: customer } = await supabaseAdmin
    .from("customers").select("id, name").eq("company_id", session.companyId)
    .eq("id", customer_id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("vision_projects")
    .update({
      customer_id,
      customer_name: customer.name,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Vision project not found" }, { status: 404 });
  }

  await logActivity({
      company_id: session.companyId,
    customer_id,
    type: "note",
    description: `Vision project saved to customer profile`,
  });

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
