import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { getSessionUser, requireRole } from "@/lib/session";

// DELETE /api/settings/integrations/[provider] — disconnect an integration
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { provider } = await params;

  const { data, error } = await supabaseAdmin
    .from("integrations")
    .update({
      status: "disconnected",
      config: {},
    })
    .eq("provider", provider)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  await logAudit({
      company_id: session.companyId,
    action: "integration_disconnected",
    category: "integrations",
    new_value: { provider },
  });

  return NextResponse.json({ success: true, provider });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
