import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit, logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// POST /api/customers/merge — merge two customer records
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

  const body = await request.json();
  const { primary_id, secondary_id } = body as {
    primary_id: string;
    secondary_id: string;
  };

  if (!primary_id || !secondary_id) {
    return NextResponse.json(
      { error: "primary_id and secondary_id are required" },
      { status: 400 }
    );
  }

  if (primary_id === secondary_id) {
    return NextResponse.json(
      { error: "Cannot merge a customer with itself" },
      { status: 400 }
    );
  }

  // Fetch both customers
  const { data: primary } = await supabaseAdmin
    .from("customers").select("*").eq("company_id", session.companyId)
    .eq("id", primary_id)
    .single();

  const { data: secondary } = await supabaseAdmin
    .from("customers").select("*").eq("company_id", session.companyId)
    .eq("id", secondary_id)
    .single();

  if (!primary || !secondary) {
    return NextResponse.json(
      { error: "One or both customers not found" },
      { status: 404 }
    );
  }

  // Reassign leads from secondary to primary
  await supabaseAdmin
    .from("leads")
    .update({ customer_id: primary_id })
    .eq("customer_id", secondary_id);

  // Reassign activities
  await supabaseAdmin
    .from("activities")
    .update({ customer_id: primary_id })
    .eq("customer_id", secondary_id);

  // Reassign invoices
  await supabaseAdmin
    .from("invoices")
    .update({ customer_id: primary_id })
    .eq("customer_id", secondary_id);

  // Reassign marketing contacts
  await supabaseAdmin
    .from("marketing_contacts")
    .update({ customer_id: primary_id })
    .eq("customer_id", secondary_id);

  // Merge tags
  const { data: secondaryTags } = await supabaseAdmin
    .from("customer_tags")
    .select("tag")
    .eq("customer_id", secondary_id);

  if (secondaryTags?.length) {
    for (const { tag } of secondaryTags) {
      await supabaseAdmin
        .from("customer_tags")
        .upsert(
          { customer_id: primary_id, tag },
          { onConflict: "customer_id,tag" }
        );
    }
  }

  // Fill empty fields on primary from secondary
  const fillFields = ["email", "phone", "address", "city", "state", "zip", "service_type", "source"];
  const updates: Record<string, unknown> = {};
  for (const field of fillFields) {
    const pVal = (primary as Record<string, unknown>)[field];
    const sVal = (secondary as Record<string, unknown>)[field];
    if (!pVal && sVal) {
      updates[field] = sVal;
    }
  }

  // Merge notes
  if (secondary.notes) {
    updates.notes = [primary.notes, `[Merged] ${secondary.notes}`]
      .filter(Boolean)
      .join("\n");
  }

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from("customers").update(updates).eq("id", primary_id);
  }

  // Soft-delete secondary
  await supabaseAdmin
    .from("customers")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", secondary_id);

  await logAudit({
      company_id: session.companyId,
    action: "customers_merged",
    category: "customers",
    entity_type: "customer",
    entity_id: primary_id,
    old_value: { secondary_id, secondary_name: secondary.name },
    new_value: { merged_into: primary_id },
  });

  await logActivity({
      company_id: session.companyId,
    customer_id: primary_id,
    type: "note",
    description: `Merged with customer "${secondary.name}" (${secondary_id})`,
  });

  return NextResponse.json({
    success: true,
    primary_id,
    merged_from: secondary_id,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
