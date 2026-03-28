import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/estimates/[id]/approve-link — generate a public approval token
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: estimate } = await supabase
    .from("estimates")
    .select("id")
    .eq("id", id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const { error } = await supabase.from("estimate_approvals").insert({
    estimate_id: id,
    token,
    status: "pending",
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    token,
    url: `${appUrl}/api/estimates/approve/${token}`,
    expires_at: expiresAt.toISOString(),
  });
}
