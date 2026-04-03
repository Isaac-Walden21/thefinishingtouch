import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email";
import { logActivity } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/invoices/[id]/resend — resend invoice email
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;

  const { data: invoice } = await supabaseAdmin
    .from("invoices").select("*, customer:customers(id, name, email)").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const email = invoice.customer?.email;
  if (!email) {
    return NextResponse.json(
      { error: "Customer has no email address" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const payUrl = `${appUrl}/pay/${id}`;

  const result = await sendEmail(
    email,
    `Invoice ${invoice.invoice_number} from The Finishing Touch LLC`,
    `
      <h2>Invoice ${invoice.invoice_number}</h2>
      <p>Hi ${invoice.customer?.name},</p>
      <p>Here is your invoice for <strong>$${Number(invoice.total).toLocaleString()}</strong>, due by ${invoice.due_date}.</p>
      <p style="margin-top:24px;">
        <a href="${payUrl}" style="background:#1e40af;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
          View & Pay Invoice
        </a>
      </p>
      <p style="margin-top:16px;color:#666;">Thank you!<br/>The Finishing Touch LLC</p>
    `
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Update sent_at
  await supabaseAdmin
    .from("invoices")
    .update({ sent_at: new Date().toISOString(), status: invoice.status === "draft" ? "sent" : invoice.status })
    .eq("id", id);

  await logActivity({
      company_id: session.companyId,
    customer_id: invoice.customer_id,
    type: "email",
    description: `Invoice ${invoice.invoice_number} resent to ${email}`,
  });

  return NextResponse.json({
    success: true,
    message: `Invoice resent to ${email}`,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
