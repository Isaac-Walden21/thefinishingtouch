import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/customers/export — CSV export with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const source = searchParams.get("source");
  const serviceType = searchParams.get("service_type");

  let query = supabaseAdmin
    .from("customers").select("*").eq("company_id", session.companyId)
    .is("archived_at", null)
    .order("name");

  if (source) query = query.eq("source", source);
  if (serviceType) query = query.eq("service_type", serviceType);

  const { data: customers, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = customers ?? [];

  // Filter by tag if specified (requires a join or subquery)
  if (tag) {
    const { data: taggedIds } = await supabaseAdmin
      .from("customer_tags")
      .select("customer_id")
      .eq("tag", tag);

    const idSet = new Set((taggedIds ?? []).map((t) => t.customer_id));
    filtered = filtered.filter((c) => idSet.has(c.id));
  }

  // Build CSV
  const headers = ["Name", "Email", "Phone", "Address", "City", "State", "Zip", "Service Type", "Source", "Created"];
  const rows = filtered.map((c) => [
    escapeCsv(c.name),
    escapeCsv(c.email ?? ""),
    escapeCsv(c.phone ?? ""),
    escapeCsv(c.address ?? ""),
    escapeCsv(c.city ?? ""),
    escapeCsv(c.state ?? ""),
    escapeCsv(c.zip ?? ""),
    escapeCsv(c.service_type ?? ""),
    escapeCsv(c.source ?? ""),
    c.created_at,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
