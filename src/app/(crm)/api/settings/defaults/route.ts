import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/settings/defaults — estimate/invoice defaults
export async function GET() {
  const { data } = await supabase
    .from("company_settings")
    .select("key, value")
    .in("key", [
      "default_margin",
      "default_tax_rate",
      "default_payment_terms",
      "default_estimate_notes",
      "default_invoice_notes",
    ]);

  const defaults: Record<string, unknown> = {};
  for (const row of data ?? []) {
    defaults[row.key] = row.value;
  }

  return NextResponse.json(defaults);
}

// PUT /api/settings/defaults — update defaults
export async function PUT(request: Request) {
  const body = await request.json();

  const allowed = [
    "default_margin",
    "default_tax_rate",
    "default_payment_terms",
    "default_estimate_notes",
    "default_invoice_notes",
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      await supabase
        .from("company_settings")
        .upsert(
          { key, value: body[key] },
          { onConflict: "key" }
        );
    }
  }

  return NextResponse.json({ success: true });
}
