import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";

// GET /api/estimates/approve/[token] — public: get estimate data for approval page
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: approval } = await supabase
    .from("estimate_approvals")
    .select("*, estimate:estimates(*)")
    .eq("token", token)
    .single();

  if (!approval) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (new Date(approval.expires_at) < new Date()) {
    return NextResponse.json({ error: "This approval link has expired" }, { status: 410 });
  }

  return NextResponse.json({
    status: approval.status,
    estimate: {
      project_type: approval.estimate.project_type,
      customer_name: approval.estimate.customer_name,
      line_items: approval.estimate.line_items,
      subtotal: approval.estimate.subtotal,
      margin: approval.estimate.margin,
      total: approval.estimate.total,
      timeline: approval.estimate.timeline,
      notes: approval.estimate.notes,
      materials: approval.estimate.materials,
    },
  });
}

// POST /api/estimates/approve/[token] — customer accepts or requests changes
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();
  const { action, response } = body as {
    action: "accept" | "request_changes";
    response?: string;
  };

  if (!action || !["accept", "request_changes"].includes(action)) {
    return NextResponse.json(
      { error: "action must be 'accept' or 'request_changes'" },
      { status: 400 }
    );
  }

  const { data: approval } = await supabase
    .from("estimate_approvals")
    .select("*, estimate:estimates(id, customer_id, project_type)")
    .eq("token", token)
    .single();

  if (!approval) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (new Date(approval.expires_at) < new Date()) {
    return NextResponse.json({ error: "This approval link has expired" }, { status: 410 });
  }

  if (approval.status !== "pending") {
    return NextResponse.json(
      { error: "This estimate has already been responded to" },
      { status: 409 }
    );
  }

  const newStatus = action === "accept" ? "accepted" : "changes_requested";

  await supabase
    .from("estimate_approvals")
    .update({
      status: newStatus,
      customer_response: response ?? null,
    })
    .eq("token", token);

  // Update estimate status
  if (action === "accept") {
    await supabase
      .from("estimates")
      .update({ status: "accepted" })
      .eq("id", approval.estimate_id);
  }

  await logActivity({
    customer_id: approval.estimate?.customer_id ?? null,
    type: "note",
    description:
      action === "accept"
        ? `Customer approved estimate for ${approval.estimate?.project_type}`
        : `Customer requested changes on estimate for ${approval.estimate?.project_type}: ${response ?? ""}`,
  });

  return NextResponse.json({
    success: true,
    status: newStatus,
    message:
      action === "accept"
        ? "Thank you! Your estimate has been approved. We will be in touch shortly."
        : "Thank you for your feedback. We will review your changes and follow up.",
  });
}
