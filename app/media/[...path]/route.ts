import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/uploadDir";

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

type Params = { params: Promise<{ path: string[] }> };

// Serves uploaded photos from UPLOAD_DIR (which may live outside the Next.js build output,
// e.g. a persistent volume on Railway/Render) instead of relying on the static /public folder.
export async function GET(_request: NextRequest, { params }: Params) {
  const { path: segments } = await params;

  if (segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ext = path.extname(segments[segments.length - 1] ?? "").toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(UPLOAD_DIR, ...segments));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
