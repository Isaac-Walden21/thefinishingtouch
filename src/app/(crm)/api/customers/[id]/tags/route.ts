import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/customers/[id]/tags — add or remove tags
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, tag } = body as { action: "add" | "remove"; tag: string };

  if (!action || !tag) {
    return NextResponse.json(
      { error: "action (add|remove) and tag are required" },
      { status: 400 }
    );
  }

  if (action === "add") {
    const { error } = await supabase
      .from("customer_tags")
      .upsert({ customer_id: id, tag }, { onConflict: "customer_id,tag" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (action === "remove") {
    const { error } = await supabase
      .from("customer_tags")
      .delete()
      .eq("customer_id", id)
      .eq("tag", tag);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
  }

  // Return updated tags
  const { data: tags } = await supabase
    .from("customer_tags")
    .select("tag")
    .eq("customer_id", id);

  return NextResponse.json({
    success: true,
    tags: (tags ?? []).map((t) => t.tag),
  });
}
