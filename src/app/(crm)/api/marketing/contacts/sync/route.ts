import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/marketing/contacts/sync — sync marketing contacts from customers
export async function POST() {
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, email")
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
    const { data: existing } = await supabase
      .from("marketing_contacts")
      .select("id")
      .eq("customer_id", customer.id)
      .limit(1)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error: insertError } = await supabase
      .from("marketing_contacts")
      .insert({
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
}
