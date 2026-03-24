import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // In production: toggle agent status in database
  return NextResponse.json({
    success: true,
    agent_id: id,
    message: "Agent status toggled",
  });
}
