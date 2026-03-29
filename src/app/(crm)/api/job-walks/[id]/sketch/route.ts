import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/job-walks/[id]/sketch — upload sketch image
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify job walk exists
  const { data: walk } = await supabase
    .from("job_walks")
    .select("id, sketch_url")
    .eq("id", id)
    .single();

  if (!walk) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("sketch") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "sketch file is required" },
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

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPEG, WebP, SVG" },
      { status: 400 }
    );
  }

  // Remove old sketch if exists
  if (walk.sketch_url) {
    const oldPath = extractStoragePath(walk.sketch_url);
    if (oldPath) {
      await supabase.storage.from("job-walk-photos").remove([oldPath]);
    }
  }

  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${id}/sketch-${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { data: uploaded, error: uploadError } = await supabase.storage
    .from("job-walk-photos")
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("job-walk-photos")
    .getPublicUrl(uploaded.path);

  // Update job walk record
  const { data, error } = await supabase
    .from("job_walks")
    .update({ sketch_url: urlData.publicUrl })
    .eq("id", id)
    .select("id, sketch_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** Extract the storage path from a full public URL */
function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(
      /\/storage\/v1\/object\/public\/job-walk-photos\/(.+)$/
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
