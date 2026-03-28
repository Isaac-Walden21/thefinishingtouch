import { NextResponse } from "next/server";
import { connectQB } from "@/lib/quickbooks";

// GET /api/qb/auth — start QuickBooks OAuth flow
export async function GET() {
  try {
    const authUrl = connectQB();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "QuickBooks not configured",
      },
      { status: 500 }
    );
  }
}
