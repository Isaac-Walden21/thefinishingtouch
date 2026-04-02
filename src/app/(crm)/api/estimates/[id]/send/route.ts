import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email";
import { logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// POST /api/estimates/[id]/send — email estimate PDF to customer
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data: estimate } = await supabaseAdmin
    .from("estimates").select("*, customer:customers(id, name, email)").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const customerEmail = estimate.customer?.email;
  if (!customerEmail) {
    return NextResponse.json(
      { error: "Customer has no email address" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Generate approval link
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await supabaseAdmin.from("estimate_approvals").insert({
    estimate_id: id,
    token,
    status: "pending",
    expires_at: expiresAt.toISOString(),
  });

  const approvalUrl = `${appUrl}/api/estimates/approve/${token}`;

  const result = await sendEmail(
    customerEmail,
    `Estimate from The Finishing Touch LLC — ${estimate.project_type}`,
    `
      <h2>Your Estimate is Ready</h2>
      <p>Hi ${estimate.customer_name},</p>
      <p>Thanks for your interest in our ${estimate.project_type} services. Here are the details of your estimate:</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Project</td><td style="padding:8px 0;font-weight:600;">${estimate.project_type}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Timeline</td><td style="padding:8px 0;">${estimate.timeline ?? "TBD"}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Total</td><td style="padding:8px 0;font-weight:600;font-size:1.2em;">$${Number(estimate.total).toLocaleString()}</td></tr>
      </table>
      ${estimate.notes ? `<p style="margin-top:16px;color:#666;">${estimate.notes}</p>` : ""}
      <p style="margin-top:24px;">
        <a href="${approvalUrl}" style="background:#1e40af;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
          Review & Approve Estimate
        </a>
      </p>
      <p style="margin-top:16px;color:#999;font-size:0.9em;">This link expires in 30 days.</p>
    `
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Failed to send email" },
      { status: 500 }
    );
  }

  // Update estimate status to sent
  await supabaseAdmin
    .from("estimates")
    .update({ status: "sent" })
    .eq("id", id);

  await logActivity({
      company_id: session.companyId,
    customer_id: estimate.customer_id,
    type: "email",
    description: `Estimate sent for ${estimate.project_type} — $${estimate.total}`,
  });

  return NextResponse.json({
    success: true,
    message: `Estimate sent to ${customerEmail}`,
    approval_token: token,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
