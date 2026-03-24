import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { campaign_id, test_email } = body;

  if (!campaign_id) {
    return NextResponse.json(
      { error: "campaign_id is required" },
      { status: 400 }
    );
  }

  // In production: use Resend to send campaign emails to all recipients in the segment.
  // If test_email is provided, send only to that address.

  return NextResponse.json({
    success: true,
    campaign_id,
    message: test_email
      ? `Test email sent to ${test_email}`
      : "Campaign queued for sending",
  });
}
