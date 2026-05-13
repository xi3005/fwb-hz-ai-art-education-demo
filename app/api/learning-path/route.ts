import { getArtwork } from "@/lib/artworks";
import { streamLearningPath } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  if (!id) return new Response("missing id", { status: 400 });
  const artwork = await getArtwork(id);
  if (!artwork) return new Response("artwork not found", { status: 404 });

  const stream = await streamLearningPath(artwork);
  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
