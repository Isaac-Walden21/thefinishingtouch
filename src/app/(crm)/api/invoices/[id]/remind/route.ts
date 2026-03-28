import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email";
import { logActivity } from "@/lib/audit";

// POST /api/invoices/[id]/remind — send payment reminder email
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customer:customers(id, name, email)")
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
    `Payment Reminder — Invoice ${invoice.invoice_number}`,
    `
      <h2>Payment Reminder</h2>
      <p>Hi ${invoice.customer?.name},</p>
      <p>This is a friendly reminder that invoice <strong>${invoice.invoice_number}</strong> for <strong>$${Number(invoice.total).toLocaleString()}</strong> is due on ${invoice.due_date}.</p>
      <p style="margin-top:24px;">
        <a href="${payUrl}" style="background:#1e40af;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
          Pay Now
        </a>
      </p>
      <p style="margin-top:16px;color:#666;">Thank you for your business!<br/>The Finishing Touch LLC</p>
    `
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await logActivity({
    customer_id: invoice.customer_id,
    type: "email",
    description: `Payment reminder sent for invoice ${invoice.invoice_number}`,
  });

  return NextResponse.json({
    success: true,
    message: `Reminder sent to ${email}`,
  });
}
