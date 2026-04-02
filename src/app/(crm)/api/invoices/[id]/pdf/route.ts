import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/invoices/[id]/pdf — generate PDF version of invoice
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("invoices").select("*, customer:customers(id, name, email, phone, address, city, state, zip)").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const customer = invoice.customer;

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

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
