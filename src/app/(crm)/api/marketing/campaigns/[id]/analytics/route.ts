import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/marketing/campaigns/[id]/analytics — detailed campaign analytics
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get recipient-level data
  const { data: recipients } = await supabase
    .from("campaign_recipients")
    .select("*, contact:marketing_contacts(name, email)")
    .eq("campaign_id", id);

  const allRecipients = recipients ?? [];
  const sent = allRecipients.filter((r) => r.status === "sent" || r.status === "delivered").length;
  const delivered = allRecipients.filter((r) => r.status === "delivered").length;
  const bounced = allRecipients.filter((r) => r.status === "bounced").length;
  const opened = allRecipients.filter((r) => r.opened_at).length;
  const clicked = allRecipients.filter((r) => r.clicked_at).length;
  const unsubscribed = allRecipients.filter((r) => r.unsubscribed_at).length;

  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;
  const bounceRate = sent > 0 ? Math.round((bounced / sent) * 100) : 0;

  return NextResponse.json({
    campaign_id: id,
    campaign_name: campaign.name,
    status: campaign.status,
    sent_at: campaign.sent_at,
    metrics: {
      total_recipients: allRecipients.length,
      sent,
      delivered,
      bounced,
      opened,
      clicked,
      unsubscribed,
      open_rate: openRate,
      click_rate: clickRate,
      bounce_rate: bounceRate,
    },
    ab_test: campaign.ab_test_config ?? null,
    recipients: allRecipients.map((r) => ({
      email: r.contact?.email,
      name: r.contact?.name,
      status: r.status,
      opened_at: r.opened_at,
      clicked_at: r.clicked_at,
      unsubscribed_at: r.unsubscribed_at,
    })),
  });
}
