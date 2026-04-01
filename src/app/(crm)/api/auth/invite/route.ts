import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const validRoles = ["admin", "manager", "crew", "sales_rep"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists in this company
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("company_id", session.companyId)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists in your company" }, { status: 400 });
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabaseAdmin
      .from("invites")
      .select("id")
      .eq("email", email)
      .eq("company_id", session.companyId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: "Pending invite already exists for this email" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .insert({
        company_id: session.companyId,
        email,
        role,
        token,
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Send invite email via Resend with link to /invite/[token]
    // For now, return the token so it can be shared manually

    return NextResponse.json({ invite, invite_url: `/invite/${token}` }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — list pending invites for the company
export async function GET() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

    const { data, error } = await supabaseAdmin
      .from("invites")
      .select("*")
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
