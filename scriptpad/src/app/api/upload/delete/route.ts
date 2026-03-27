import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "~/server/auth";
import { env } from "~/env";

export async function POST(request: Request) {
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = (await request.json()) as { fileUrl: string };
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    // Extract the storage path from the public URL
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/attachments\/(.+)/,
    );

    if (!pathMatch?.[1]) {
      return NextResponse.json(
        { error: "Invalid file URL" },
        { status: 400 },
      );
    }

    const storagePath = decodeURIComponent(pathMatch[1]);

    // Verify the file belongs to this user (path starts with userId/)
    if (!storagePath.startsWith(`${session.user.id}/`)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase.storage
      .from("attachments")
      .remove([storagePath]);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete route error:", err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 },
    );
  }
}
