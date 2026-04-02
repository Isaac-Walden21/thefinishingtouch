import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";
import { logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/marketing/sms/send — send SMS campaign to tagged contacts
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const body = await request.json();
  const { message, tags, phone_numbers } = body as {
    message: string;
    tags?: string[];
    phone_numbers?: string[];
  };

  if (!message) {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  const recipients: string[] = [];

  // Get phone numbers from tagged customers
  if (tags?.length) {
    const { data: taggedCustomers } = await supabaseAdmin
      .from("customer_tags")
      .select("customer_id")
      .in("tag", tags);

    if (taggedCustomers?.length) {
      const ids = taggedCustomers.map((t) => t.customer_id);
      const { data: customers } = await supabaseAdmin
        .from("customers").select("phone").eq("company_id", session.companyId)
        .in("id", ids)
        .not("phone", "is", null);

      for (const c of customers ?? []) {
        if (c.phone) recipients.push(c.phone);
      }
    }
  }

  // Add explicit phone numbers
  if (phone_numbers?.length) {
    recipients.push(...phone_numbers);
  }

  // Deduplicate
  const unique = [...new Set(recipients.map((p) => p.replace(/\D/g, "")))];

  if (unique.length === 0) {
    return NextResponse.json(
      { error: "No recipients found" },
      { status: 400 }
    );
  }

  let sent = 0;
  const errors: Array<{ phone: string; error: string }> = [];

  for (const phone of unique) {
    try {
      const result = await sendSMS(phone, message);
      if (result.success) {
        sent++;
      } else {
        errors.push({ phone, error: result.error ?? "Failed" });
      }
    } catch (error) {
      errors.push({
        phone,
        error: error instanceof Error ? error.message : "Send failed",
      });
    }
  }

  await logAudit({
      company_id: session.companyId,
    action: "sms_campaign_sent",
    category: "marketing",
    new_value: { sent, errors: errors.length, total: unique.length },
  });

  return NextResponse.json({
    success: true,
    sent,
    failed: errors.length,
    total: unique.length,
    errors: errors.length > 0 ? errors : undefined,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
