import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/marketing/referral/leaderboard — referral stats
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { data: referrals, error } = await supabaseAdmin
    .from("referrals").select("referrer_customer_id, status, customer:customers(name)").eq("company_id", session.companyId)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate by referrer
  const stats = new Map<
    string,
    { customer_name: string; total: number; converted: number }
  >();

  for (const ref of referrals ?? []) {
    const id = ref.referrer_customer_id;
    const existing = stats.get(id) ?? {
      customer_name: (ref.customer as unknown as { name: string })?.name ?? "Unknown",
      total: 0,
      converted: 0,
    };
    existing.total++;
    if (ref.status === "converted") existing.converted++;
    stats.set(id, existing);
  }

  const leaderboard = Array.from(stats.entries())
    .map(([customer_id, s]) => ({
      customer_id,
      customer_name: s.customer_name,
      total_referrals: s.total,
      converted: s.converted,
      conversion_rate:
        s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.converted - a.converted || b.total_referrals - a.total_referrals);

  return NextResponse.json({
    leaderboard,
    total_referrals: referrals?.length ?? 0,
    total_converted: referrals?.filter((r) => r.status === "converted").length ?? 0,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
