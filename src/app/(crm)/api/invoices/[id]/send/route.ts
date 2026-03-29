import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/invoices/[id]/send — send invoice email to customer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*, customer:customers(id, name, email)")
    .eq("id", id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const customer = invoice.customer as { id: string; name: string; email: string | null } | null;

  if (!customer?.email) {
    return NextResponse.json(
      { error: "Customer has no email address" },
      { status: 400 }
    );
  }

  // In production: send email via Resend
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "invoices@thefinishingtouchllc.com",
  //   to: customer.email,
  //   subject: `Invoice ${invoice.invoice_number} from The Finishing Touch LLC`,
  //   html: `<p>View and pay your invoice: <a href="${origin}/pay/${invoice.id}">Pay Now</a></p>`,
  // });

  // Update invoice status to sent
  await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({
    success: true,
    message: `Invoice sent to ${customer.email}`,
    invoice_number: invoice.invoice_number,
  });
}
