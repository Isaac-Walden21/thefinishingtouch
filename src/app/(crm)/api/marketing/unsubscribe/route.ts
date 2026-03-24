import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("uid");

  if (!contactId) {
    return new NextResponse("Missing contact identifier", { status: 400 });
  }

  // In production: mark contact as unsubscribed in the database.

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#0a101e;color:#e2e8f0;">
  <h1 style="color:#fff;">You've been unsubscribed</h1>
  <p>You will no longer receive marketing emails from The Finishing Touch.</p>
  <p style="color:#94a3b8;">If this was a mistake, please contact us at hello@thefinishingtouchllc.com</p>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
