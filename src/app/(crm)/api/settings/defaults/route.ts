import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/settings/defaults — estimate/invoice defaults
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { data } = await supabaseAdmin
    .from("company_settings").select("key, value").eq("company_id", session.companyId)
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

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings/defaults — update defaults
export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

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
      await supabaseAdmin
        .from("company_settings")
        .upsert(
          { key, value: body[key] },
          { onConflict: "key" }
        );
    }
  }

  return NextResponse.json({ success: true });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
