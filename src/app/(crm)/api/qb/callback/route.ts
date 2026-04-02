import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// GET /api/qb/callback — QuickBooks OAuth callback
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code not received" },
      { status: 400 }
    );
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "QuickBooks not configured" },
      { status: 500 }
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/qb/callback`;

  try {
    const tokenRes = await fetch(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Token exchange failed: ${err}`);
    }

    const tokens = await tokenRes.json();

    // Store connection in integrations table
    await supabaseAdmin.from("integrations").upsert(
      {
        provider: "quickbooks",
        config: {
          realm_id: realmId,
          refresh_token: tokens.refresh_token,
          connected_at: new Date().toISOString(),
        },
        status: "connected",
        last_activity: new Date().toISOString(),
      },
      { onConflict: "provider" }
    );

    await logAudit({
      company_id: session.companyId,
      action: "quickbooks_connected",
      category: "integrations",
      new_value: { realm_id: realmId },
    });

    // Redirect back to settings page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/settings?qb=connected`);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "OAuth callback failed",
      },
      { status: 500 }
    );
  }

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
