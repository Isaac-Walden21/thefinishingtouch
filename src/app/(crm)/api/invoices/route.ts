import { NextResponse } from "next/server";
import { demoInvoices } from "@/lib/demo-data";

// GET /api/invoices — list all invoices
export async function GET() {
  return NextResponse.json(demoInvoices);
}

// POST /api/invoices — create a new invoice
export async function POST(request: Request) {
  const body = await request.json();

  // In production: validate & insert into Supabase
  const invoice = {
    id: `inv-${Date.now()}`,
    invoice_number: `TFT-${String(demoInvoices.length + 1).padStart(4, "0")}`,
    status: "draft",
    ...body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(invoice, { status: 201 });
}
