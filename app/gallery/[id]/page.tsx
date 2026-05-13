import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtwork } from "@/lib/artworks";
import { LearningPath } from "@/components/LearningPath";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await getArtwork(id);
  return { title: a ? `${a.title} · 作品库` : "作品详情" };
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = await getArtwork(id);
  if (!artwork) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/gallery"
        className="text-sm text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 mb-6"
      >
        ← 返回作品库
      </Link>
      <div className="grid md:grid-cols-[1.1fr_1fr] gap-10">
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100">
          <Image
            src={artwork.image_url}
            alt={artwork.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{artwork.title}</h1>
            <p className="text-stone-600 mt-1">
              {artwork.artist}
              {artwork.year ? ` · ${artwork.year}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {artwork.theme.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 bg-stone-900 text-white rounded">
                主题 · {t}
              </span>
            ))}
            {artwork.style.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 bg-stone-200 text-stone-800 rounded">
                风格 · {s}
              </span>
            ))}
            <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded">
              形式 · {artwork.form}
            </span>
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
              难度 · {artwork.difficulty} / 5
            </span>
          </div>
          <p className="text-stone-700 leading-7">{artwork.description}</p>
          <div className="pt-4 border-t border-stone-200">
            <LearningPath artworkId={artwork.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
