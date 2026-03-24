import { NextResponse } from "next/server";
import { demoInvoices, demoCustomers } from "@/lib/demo-data";

// GET /api/invoices/[id]/pdf — generate PDF version of invoice
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = demoInvoices.find((i) => i.id === id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const customer = demoCustomers.find((c) => c.id === invoice.customer_id);

  // In production: use a PDF library (e.g. @react-pdf/renderer, puppeteer, etc.)
  // For now, return invoice data that a client-side PDF generator could use
  return NextResponse.json({
    invoice,
    customer,
    company: {
      name: "The Finishing Touch LLC",
      address: "9909 East 100 South",
      city: "Greentown",
      state: "IN",
      zip: "46936",
      phone: "(765) 555-0100",
    },
  });
}
