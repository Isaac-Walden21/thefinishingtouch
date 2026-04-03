import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSessionUser();

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", session.companyId)
      .single();

    return NextResponse.json({
      user: session.user,
      company,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
