import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/customers/duplicates — check for potential duplicate customers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const name = searchParams.get("name");

  if (!phone && !name) {
    return NextResponse.json(
      { error: "Provide phone or name to check for duplicates" },
      { status: 400 }
    );
  }

  const duplicates: Array<{ id: string; name: string; phone: string | null; match_type: string }> = [];

  // Exact phone match
  if (phone) {
    const normalized = phone.replace(/\D/g, "");
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone")
      .is("archived_at", null);

    if (data) {
      for (const c of data) {
        if (c.phone && c.phone.replace(/\D/g, "") === normalized) {
          duplicates.push({ ...c, match_type: "phone_exact" });
        }
      }
    }
  }

  // Fuzzy name match (case-insensitive contains)
  if (name) {
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone")
      .is("archived_at", null)
      .ilike("name", `%${name}%`);

    if (data) {
      const existingIds = new Set(duplicates.map((d) => d.id));
      for (const c of data) {
        if (!existingIds.has(c.id)) {
          duplicates.push({ ...c, match_type: "name_fuzzy" });
        }
      }
    }
  }

  return NextResponse.json({ duplicates });
}
