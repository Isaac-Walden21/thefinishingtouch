import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/qb/status — get QuickBooks sync status
export async function GET() {
  try {
    const session = await getSessionUser();

  const { data: integration } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .eq("provider", "quickbooks")
    .single();

  if (!integration) {
    return NextResponse.json({
      connected: false,
      status: "disconnected",
      message: "QuickBooks is not connected",
    });
  }

  return NextResponse.json({
    connected: integration.status === "connected",
    status: integration.status,
    last_activity: integration.last_activity,
    realm_id: (integration.config as Record<string, unknown>)?.realm_id ?? null,
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
