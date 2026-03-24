import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "open" or "click"
  const campaignId = searchParams.get("cid");
  const contactId = searchParams.get("uid");
  const redirect = searchParams.get("redirect");

  // In production: record the open/click event in the database.

  if (type === "open") {
    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  if (type === "click" && redirect) {
    return NextResponse.redirect(redirect);
  }

  return NextResponse.json({ success: true });
}
