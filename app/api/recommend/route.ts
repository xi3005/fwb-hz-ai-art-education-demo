import { NextResponse } from "next/server";
import { listArtworks } from "@/lib/artworks";
import { recommendArtworks } from "@/lib/claude";
import type { UserPreference } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const pref = (await req.json()) as UserPreference;
  if (!pref || typeof pref !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const library = await listArtworks();
  const result = await recommendArtworks(
    {
      themes: Array.isArray(pref.themes) ? pref.themes : [],
      styles: Array.isArray(pref.styles) ? pref.styles : [],
      difficulty: Number(pref.difficulty) || 1,
      freeText: typeof pref.freeText === "string" ? pref.freeText : "",
    },
    library,
  );
  const byId = new Map(library.map((a) => [a.id, a]));
  const picks = result.picks
    .map((p) => {
      const art = byId.get(p.id);
      return art ? { artwork: art, reason: p.reason } : null;
    })
    .filter(Boolean);
  return NextResponse.json({
    intro: result.intro,
    source: result.source,
    picks,
  });
}
