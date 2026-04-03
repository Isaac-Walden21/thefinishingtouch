import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// GET /api/qb/callback -- QuickBooks OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");
    const stateParam = searchParams.get("state");

    if (!code || !stateParam) {
      return NextResponse.json(
        { error: "Missing authorization code or state" },
        { status: 400 }
      );
    }

    let companyId: string;
    try {
      const state = JSON.parse(stateParam);
      companyId = state.companyId;
    } catch {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId in state" },
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

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/qb/callback`;

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
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({
        qb_realm_id: realmId,
        qb_access_token: tokens.access_token,
        qb_refresh_token: tokens.refresh_token,
        qb_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", companyId);

    if (updateError) {
      throw new Error(`Failed to save QB tokens: ${updateError.message}`);
    }

    await logAudit({
      company_id: companyId,
      action: "quickbooks_connected",
      category: "integrations",
      new_value: { realm_id: realmId },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/settings?qb=connected`);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
