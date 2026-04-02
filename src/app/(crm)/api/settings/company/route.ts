import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/settings/company — get company profile
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { data } = await supabaseAdmin
    .from("company_settings").select("key, value").eq("company_id", session.companyId)
    .in("key", ["company_name", "company_phone", "company_email", "company_address", "company_logo_url", "company_website", "tax_rate"]);

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings/company — update company profile
export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const body = await request.json();

  const allowed = ["company_name", "company_phone", "company_email", "company_address", "company_logo_url", "company_website", "tax_rate"];

  const updates: Array<{ key: string; value: unknown }> = [];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push({ key, value: body[key] });
    }
  }

  for (const update of updates) {
    await supabaseAdmin
      .from("company_settings")
      .upsert(
        { key: update.key, value: update.value as Record<string, unknown> },
        { onConflict: "key" }
      );
  }

  return NextResponse.json({ success: true, updated: updates.length });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
