import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// POST /api/settings/integrations/[provider]/connect — connect an integration
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const body = await request.json();
  const { config } = body as { config?: Record<string, unknown> };

  const supported = ["quickbooks", "google-calendar", "twilio", "google-places"];
  if (!supported.includes(provider)) {
    return NextResponse.json(
      { error: `Unsupported provider: ${provider}. Supported: ${supported.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("integrations")
    .upsert(
      {
        provider,
        config: config ?? {},
        status: "connected",
        last_activity: new Date().toISOString(),
      },
      { onConflict: "provider" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "integration_connected",
    category: "integrations",
    new_value: { provider },
  });

  return NextResponse.json(data);
}
