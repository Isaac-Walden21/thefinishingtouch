import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { token, name, password } = await request.json();

  if (!token || !name || !password) {
    return NextResponse.json({ error: "Token, name, and password are required" }, { status: 400 });
  }

  // Look up invite
  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("*, company:companies(id, name)")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create app user record
  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      id: authData.user.id,
      company_id: invite.company_id,
      name,
      email: invite.email,
      role: invite.role,
    });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Mark invite as accepted
  await supabaseAdmin
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Sign in
  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: invite.email,
    password,
  });

  if (signInError || !session.session) {
    return NextResponse.json({ error: "Account created but sign-in failed. Try logging in." }, { status: 500 });
  }

  const response = NextResponse.json({ success: true }, { status: 201 });

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
