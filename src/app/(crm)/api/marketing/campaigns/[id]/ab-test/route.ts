import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/marketing/campaigns/[id]/ab-test — configure A/B test
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin", "manager"]);

  const { id } = await params;
  const body = await request.json();
  const { variant_b_subject, variant_b_body, split_percentage } = body as {
    variant_b_subject: string;
    variant_b_body?: string;
    split_percentage?: number;
  };

  if (!variant_b_subject) {
    return NextResponse.json(
      { error: "variant_b_subject is required" },
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
      { error: "Can only configure A/B tests on draft campaigns" },
      { status: 400 }
    );
  }

  const abConfig = {
    enabled: true,
    variant_b_subject,
    variant_b_body: variant_b_body ?? null,
    split_percentage: split_percentage ?? 50,
  };

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .update({ ab_test_config: abConfig })
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
