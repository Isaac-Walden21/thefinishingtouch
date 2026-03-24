import { NextResponse } from "next/server";

// POST /api/invoices/[id]/view — log read receipt when customer views invoice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // In production: update invoices SET viewed_at = now() WHERE id = $1 AND viewed_at IS NULL
  // Also log an activity entry for the CRM feed

  return NextResponse.json({
    success: true,
    invoice_id: id,
    viewed_at: new Date().toISOString(),
  });
}
