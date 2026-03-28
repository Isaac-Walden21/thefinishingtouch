import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";

// POST /api/vision/[id]/save — save vision project to customer record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("id", customer_id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { data, error } = await supabase
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
    customer_id,
    type: "note",
    description: `Vision project saved to customer profile`,
  });

  return NextResponse.json(data);
}
