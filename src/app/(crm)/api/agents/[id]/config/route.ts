import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // In production: update agent config in database
  return NextResponse.json({
    success: true,
    agent_id: id,
    config: body,
    message: "Agent configuration updated",
  });
}
