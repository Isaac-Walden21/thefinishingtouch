import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/referral/[code] — public referral landing page data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: referral } = await supabase
    .from("referrals")
    .select("code, status, customer:customers(name)")
    .eq("code", code)
    .single();

  if (!referral) {
    return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
  }

  const referrerName = (referral.customer as unknown as { name: string })?.name ?? "A friend";

  return NextResponse.json({
    code: referral.code,
    referred_by: referrerName,
    message: `${referrerName} thought you might be interested in The Finishing Touch LLC! We specialize in concrete, post frame buildings, landscaping, and more. Contact us for a free estimate!`,
    contact: {
      phone: "(765) 628-0022",
      website: "https://thefinishingtouchllc.com",
    },
  });
}
