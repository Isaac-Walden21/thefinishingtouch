import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { id } = await params;

  // In production: toggle agent status in database
  return NextResponse.json({
    success: true,
    agent_id: id,
    message: "Agent status toggled",
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
