import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/qb/status — get QuickBooks sync status
export async function GET() {
  const { data: integration } = await supabase
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
}
