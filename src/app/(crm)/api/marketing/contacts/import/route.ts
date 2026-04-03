import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/marketing/contacts/import — CSV import of contacts
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const body = await request.json();
  const { contacts } = body as {
    contacts: Array<{
      name: string;
      email: string;
      tags?: string[];
    }>;
  };

  if (!contacts?.length) {
    return NextResponse.json(
      { error: "contacts array is required" },
      { status: 400 }
    );
  }

  let imported = 0;
  let skipped = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const contact of contacts) {
    if (!contact.email || !contact.name) {
      skipped++;
      continue;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.push({ email: contact.email, error: "Invalid email format" });
      continue;
    }

    // Check for existing
    const { data: existing } = await supabaseAdmin
      .from("marketing_contacts").select("id").eq("company_id", session.companyId)
      .eq("email", contact.email)
      .limit(1)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabaseAdmin.from("marketing_contacts").insert({
      company_id: session.companyId,
      name: contact.name,
      email: contact.email,
      tags: contact.tags ?? [],
      subscribed: true,
    });

    if (error) {
      errors.push({ email: contact.email, error: error.message });
    } else {
      imported++;
    }
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
    total_submitted: contacts.length,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
