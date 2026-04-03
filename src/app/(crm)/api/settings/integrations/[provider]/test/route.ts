import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, requireRole } from "@/lib/session";

// POST /api/settings/integrations/[provider]/test — test integration connection
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { provider } = await params;

  const { data: integration } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .eq("provider", provider)
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "Integration not configured" },
      { status: 404 }
    );
  }

  try {
    let testResult: { success: boolean; message: string };

    switch (provider) {
      case "quickbooks": {
        const hasKeys = !!(
          process.env.QUICKBOOKS_CLIENT_ID &&
          process.env.QUICKBOOKS_CLIENT_SECRET &&
          process.env.QUICKBOOKS_REALM_ID
        );
        testResult = hasKeys
          ? { success: true, message: "QuickBooks credentials configured" }
          : { success: false, message: "QuickBooks environment variables missing" };
        break;
      }
      case "google-calendar": {
        const hasKeys = !!(
          process.env.GOOGLE_CALENDAR_CLIENT_ID &&
          process.env.GOOGLE_CALENDAR_CLIENT_SECRET
        );
        testResult = hasKeys
          ? { success: true, message: "Google Calendar credentials configured" }
          : { success: false, message: "Google Calendar environment variables missing" };
        break;
      }
      case "twilio": {
        const hasKeys = !!(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_PHONE_NUMBER
        );
        testResult = hasKeys
          ? { success: true, message: "Twilio credentials configured" }
          : { success: false, message: "Twilio environment variables missing" };
        break;
      }
      default:
        testResult = { success: false, message: `Unknown provider: ${provider}` };
    }

    // Update integration status based on test
    await supabaseAdmin
      .from("integrations")
      .update({
        status: testResult.success ? "connected" : "error",
        last_activity: new Date().toISOString(),
      })
      .eq("provider", provider);

    return NextResponse.json(testResult);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      },
      { status: 500 }
    );
  }

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
