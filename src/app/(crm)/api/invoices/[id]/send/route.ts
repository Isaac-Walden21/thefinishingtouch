import { NextResponse } from "next/server";
import { demoInvoices, demoCustomers } from "@/lib/demo-data";

// POST /api/invoices/[id]/send — send invoice email to customer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = demoInvoices.find((i) => i.id === id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const customer = demoCustomers.find((c) => c.id === invoice.customer_id);

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

  return NextResponse.json({
    success: true,
    message: `Invoice sent to ${customer.email}`,
    invoice_number: invoice.invoice_number,
  });
}
