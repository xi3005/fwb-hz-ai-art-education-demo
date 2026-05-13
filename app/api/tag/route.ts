import { NextResponse } from "next/server";
import { autoTag } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { dataUrl } = (await req.json()) as { dataUrl?: string };
  if (!dataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "expected data URL" }, { status: 400 });
  }
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
  }
  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/webp";
  const base64 = match[2];
  const tags = await autoTag(base64, mediaType);
  return NextResponse.json(tags);
}
