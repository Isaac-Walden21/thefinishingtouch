import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data: session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !session.session) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Look up app user
  const { data: appUser } = await supabaseAdmin
    .from("users")
    .select("*, company:companies(id, name, slug, is_active)")
    .eq("id", session.user.id)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "User account not found" }, { status: 401 });
  }

  if (!appUser.is_active) {
    return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
  }

  if (appUser.company && !appUser.company.is_active && !appUser.is_super_admin) {
    return NextResponse.json({ error: "Company account is inactive" }, { status: 403 });
  }

  const response = NextResponse.json({
    user: appUser,
    company: appUser.company,
  });

  response.cookies.set("sb-access-token", session.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  response.cookies.set("sb-refresh-token", session.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
