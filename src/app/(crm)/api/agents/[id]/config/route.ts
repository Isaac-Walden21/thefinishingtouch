import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  const { id } = await params;
  const body = await request.json();

  // In production: update agent config in database
  return NextResponse.json({
    success: true,
    agent_id: id,
    config: body,
    message: "Agent configuration updated",
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
