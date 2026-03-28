import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "~/server/auth";
import { env } from "~/env";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".mp4",
  ".mov",
  ".mp3",
  ".m4a",
  ".wav",
]);

export async function POST(request: Request) {
  // Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 500 },
    );
  }

  // Use service key — bypasses RLS for Storage
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Ensure the attachments bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === "attachments")) {
    const { error: bucketError } = await supabase.storage.createBucket(
      "attachments",
      { public: true },
    );
    if (bucketError) {
      console.error("Failed to create attachments bucket:", bucketError);
      return NextResponse.json(
        { error: "Storage setup failed" },
        { status: 500 },
      );
    }
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const scriptId = formData.get("scriptId") as string | null;

    if (!file || !scriptId) {
      return NextResponse.json(
        { error: "Missing file or scriptId" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 },
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `File type "${file.type}" is not allowed. Accepted types: images (PNG, JPG, GIF, WebP), videos (MP4, MOV), and audio (MP3, M4A, WAV).`,
        },
        { status: 400 },
      );
    }

    // Validate file extension
    const extension = file.name.includes(".")
      ? `.${file.name.split(".").pop()?.toLowerCase()}`
      : "";
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        {
          error: `File extension "${extension || "(none)"}" is not allowed. Accepted extensions: ${[...ALLOWED_EXTENSIONS].join(", ")}.`,
        },
        { status: 400 },
      );
    }

    const fileName = `${session.user.id}/${scriptId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("attachments").getPublicUrl(fileName);

    return NextResponse.json({ publicUrl, fileName: file.name });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
