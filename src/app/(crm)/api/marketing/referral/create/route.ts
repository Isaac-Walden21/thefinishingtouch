import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/marketing/referral/create — create a referral code for a customer
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const body = await request.json();
  const { customer_id } = body as { customer_id: string };

  if (!customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  const { data: customer } = await supabaseAdmin
    .from("customers").select("id, name").eq("company_id", session.companyId)
    .eq("id", customer_id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Check if customer already has a referral code
  const { data: existing } = await supabaseAdmin
    .from("referrals").select("code").eq("company_id", session.companyId)
    .eq("referrer_customer_id", customer_id)
    .limit(1)
    .single();

  if (existing) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json({
      code: existing.code,
      url: `${appUrl}/api/referral/${existing.code}`,
      message: "Customer already has a referral code",
    });
  }

  // Generate a readable code from customer name
  const nameSlug = customer.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const code = `${nameSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabaseAdmin.from("referrals").insert({
      company_id: session.companyId,
    referrer_customer_id: customer_id,
    code,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    code,
    url: `${appUrl}/api/referral/${code}`,
    customer_name: customer.name,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
