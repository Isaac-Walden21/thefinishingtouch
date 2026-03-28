import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/marketing/referral/leaderboard — referral stats
export async function GET() {
  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("referrer_customer_id, status, customer:customers(name)")
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
}
