import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// GET /api/settings/notifications — get notification preferences
export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "user_id query parameter is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings/notifications — update notification preferences
export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const body = await request.json();
  const { user_id, preferences } = body as {
    user_id: string;
    preferences: Array<{
      event: string;
      channel: string;
      enabled: boolean;
    }>;
  };

  if (!user_id || !preferences?.length) {
    return NextResponse.json(
      { error: "user_id and preferences array are required" },
      { status: 400 }
    );
  }

  for (const pref of preferences) {
    await supabaseAdmin
      .from("notification_preferences")
      .upsert(
        {
          user_id,
          event: pref.event,
          channel: pref.channel,
          enabled: pref.enabled,
        },
        { onConflict: "user_id,event,channel" }
      );
  }

  return NextResponse.json({ success: true, updated: preferences.length });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
