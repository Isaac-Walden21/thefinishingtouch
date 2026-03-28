import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;

// In-memory rate limiting — resets on each Vercel cold start.
// TODO: Replace with Upstash Redis or Vercel KV for production.
// This is a known limitation: on serverless, each new instance starts fresh,
// so sustained abuse across instances will bypass the limit.
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expected = process.env.VAPI_API_KEY;
  if (!expected) return false;
  return apiKey === expected;
}

export function rateLimit(
  key: string,
  maxRequests: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function rateLimitedResponse() {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + 60),
      },
    }
  );
}
