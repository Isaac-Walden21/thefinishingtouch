import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity, logAudit } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// POST /api/job-walks/[id]/complete — mark job walk as complete
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data: walk } = await supabaseAdmin
    .from("job_walks").select("*, customer:customers(id, name)").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!walk) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  if (walk.status === "completed" || walk.status === "estimated") {
    return NextResponse.json(
      { error: `Job walk is already ${walk.status}` },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("job_walks")
    .update({
      status: "completed",
      completed_at: now,
    })
    .eq("id", id)
    .select("*, customer:customers(id, name, email, phone, address)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customerName = walk.customer?.name ?? "Unknown";

  await logActivity({
      company_id: session.companyId,
    customer_id: walk.customer_id,
    lead_id: walk.lead_id ?? null,
    type: "note",
    description: `Job walk completed for ${customerName}`,
    created_by: walk.created_by ?? null,
  });

  await logAudit({
      company_id: session.companyId,
    action: "job_walk_completed",
    category: "job_walks",
    entity_type: "job_walk",
    entity_id: id,
    old_value: { status: "draft" },
    new_value: { status: "completed", completed_at: now },
  });

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
