import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/job-walks/[id]/photos — upload a photo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify job walk exists
  const { data: walk } = await supabase
    .from("job_walks")
    .select("id")
    .eq("id", id)
    .single();

  if (!walk) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;
  const caption = formData.get("caption") as string | null;
  const category = (formData.get("category") as string) || "overview";

  if (!file) {
    return NextResponse.json(
      { error: "photo file is required" },
      { status: 400 }
    );
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large. Maximum 10MB." },
      { status: 400 }
    );
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPEG, WebP, HEIC" },
      { status: 400 }
    );
  }

  const validCategories = [
    "overview",
    "existing_condition",
    "obstacle",
    "measurement_reference",
    "customer_request",
  ];
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: `Invalid category. Allowed: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { data: uploaded, error: uploadError } = await supabase.storage
    .from("job-walk-photos")
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("job-walk-photos")
    .getPublicUrl(uploaded.path);

  // Get max sort_order for this job walk
  const { data: maxSort } = await supabase
    .from("job_walk_photos")
    .select("sort_order")
    .eq("job_walk_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSort = (maxSort?.sort_order ?? -1) + 1;

  const { data: photo, error: insertError } = await supabase
    .from("job_walk_photos")
    .insert({
      job_walk_id: id,
      photo_url: urlData.publicUrl,
      caption: caption || null,
      category,
      sort_order: nextSort,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(photo, { status: 201 });
}
