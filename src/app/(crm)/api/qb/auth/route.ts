import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { connectQB } from "@/lib/quickbooks";

// GET /api/qb/auth -- start QuickBooks OAuth flow
export async function GET() {
  try {
    const session = await getSessionUser();
    const authUrl = connectQB(session.companyId);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
