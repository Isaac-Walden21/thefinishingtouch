import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password, company_name } = body;

  if (!name || !email || !password || !company_name) {
    return NextResponse.json(
      { error: "Name, email, password, and company name are required" },
      { status: 400 }
    );
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const authUserId = authData.user.id;

  // Generate slug from company name
  const slug = company_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check slug uniqueness
  const { data: existingSlug } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single();

  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

  // Create company
  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .insert({
      name: company_name,
      slug: finalSlug,
    })
    .select("*")
    .single();

  if (companyError) {
    // Cleanup: delete the auth user we just created
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  // Create user record
  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      id: authUserId,
      company_id: company.id,
      name,
      email,
      role: "owner",
    });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    await supabaseAdmin.from("companies").delete().eq("id", company.id);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Sign in to get tokens
  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !session.session) {
    return NextResponse.json({ error: "Account created but sign-in failed" }, { status: 500 });
  }

  const response = NextResponse.json({ user: { id: authUserId, name, email, role: "owner" }, company }, { status: 201 });

  response.cookies.set("sb-access-token", session.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  response.cookies.set("sb-refresh-token", session.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
