import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/marketing/campaigns/[id]/schedule — schedule a campaign
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;
  const body = await request.json();
  const { scheduled_at } = body as { scheduled_at: string };

  if (!scheduled_at) {
    return NextResponse.json(
      { error: "scheduled_at is required (ISO 8601)" },
      { status: 400 }
    );
  }

  const scheduleDate = new Date(scheduled_at);
  if (scheduleDate <= new Date()) {
    return NextResponse.json(
      { error: "scheduled_at must be in the future" },
      { status: 400 }
    );
  }

  const { data: campaign } = await supabaseAdmin
    .from("campaigns").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "draft") {
    return NextResponse.json(
      { error: "Can only schedule draft campaigns" },
      { status: 400 }
    );
  }

  // Count matching recipients
  const { count } = await supabaseAdmin
    .from("marketing_contacts").select("*", { count: "exact", head: true }).eq("company_id", session.companyId)
    .eq("subscribed", true)
    .overlaps("tags", campaign.segment_tags?.length ? campaign.segment_tags : []);

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .update({
      status: "scheduled",
      scheduled_at,
      recipients_count: count ?? 0,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
