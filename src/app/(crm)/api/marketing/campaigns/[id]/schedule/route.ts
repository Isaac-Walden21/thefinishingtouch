import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/marketing/campaigns/[id]/schedule — schedule a campaign
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
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
  const { count } = await supabase
    .from("marketing_contacts")
    .select("*", { count: "exact", head: true })
    .eq("subscribed", true)
    .overlaps("tags", campaign.segment_tags?.length ? campaign.segment_tags : []);

  const { data, error } = await supabase
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
}
