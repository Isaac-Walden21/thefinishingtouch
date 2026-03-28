import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/settings/company — get company profile
export async function GET() {
  const { data } = await supabase
    .from("company_settings")
    .select("key, value")
    .in("key", ["company_name", "company_phone", "company_email", "company_address", "company_logo_url", "company_website", "tax_rate"]);

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}

// PUT /api/settings/company — update company profile
export async function PUT(request: Request) {
  const body = await request.json();

  const allowed = ["company_name", "company_phone", "company_email", "company_address", "company_logo_url", "company_website", "tax_rate"];

  const updates: Array<{ key: string; value: unknown }> = [];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push({ key, value: body[key] });
    }
  }

  for (const update of updates) {
    await supabase
      .from("company_settings")
      .upsert(
        { key: update.key, value: update.value as Record<string, unknown> },
        { onConflict: "key" }
      );
  }

  return NextResponse.json({ success: true, updated: updates.length });
}
