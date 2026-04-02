import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

// POST /api/qb/sync — manual sync trigger (delegates to invoices/qb-sync)
export async function POST() {
  try {
    const session = await getSessionUser();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const res = await fetch(`${appUrl}/api/invoices/qb-sync`, {
      method: "POST",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
