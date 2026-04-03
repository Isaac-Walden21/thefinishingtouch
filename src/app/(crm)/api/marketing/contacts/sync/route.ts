import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/marketing/contacts/sync — sync marketing contacts from customers
export async function POST() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { data: customers, error } = await supabaseAdmin
    .from("customers").select("id, name, email").eq("company_id", session.companyId)
    .not("email", "is", null)
    .is("archived_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let created = 0;
  let skipped = 0;

  for (const customer of customers ?? []) {
    if (!customer.email) continue;

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from("marketing_contacts").select("id").eq("company_id", session.companyId)
      .eq("customer_id", customer.id)
      .limit(1)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error: insertError } = await supabaseAdmin
      .from("marketing_contacts").insert({
      company_id: session.companyId,
        customer_id: customer.id,
        name: customer.name,
        email: customer.email,
        tags: [],
        subscribed: true,
      });

    if (insertError) {
      skipped++;
    } else {
      created++;
    }
  }

  return NextResponse.json({
    success: true,
    created,
    skipped,
    total_customers: customers?.length ?? 0,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
