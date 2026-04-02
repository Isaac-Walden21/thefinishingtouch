import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// POST /api/estimates/[id]/approve-link — generate a public approval token
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data: estimate } = await supabaseAdmin
    .from("estimates").select("id").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const { error } = await supabaseAdmin.from("estimate_approvals").insert({
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

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
