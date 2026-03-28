import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// DELETE /api/settings/integrations/[provider] — disconnect an integration
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  const { data, error } = await supabase
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
    action: "integration_disconnected",
    category: "integrations",
    new_value: { provider },
  });

  return NextResponse.json({ success: true, provider });
}
