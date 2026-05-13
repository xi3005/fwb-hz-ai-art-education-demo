import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/lib/types";

export function ArtCard({ artwork, reason }: { artwork: Artwork; reason?: string }) {
  return (
    <Link
      href={`/gallery/${artwork.id}`}
      className="group flex flex-col rounded-xl overflow-hidden bg-white ring-1 ring-stone-200 hover:ring-stone-400 transition-all"
    >
      <div className="relative aspect-[4/5] bg-stone-100">
        <Image
          src={artwork.image_url}
          alt={artwork.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          unoptimized
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <span className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white rounded">
            难度 {artwork.difficulty}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <div className="font-medium leading-tight">{artwork.title}</div>
        <div className="text-xs text-stone-500">
          {artwork.artist}
          {artwork.year ? ` · ${artwork.year}` : ""}
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {[...artwork.theme.slice(0, 2), ...artwork.style.slice(0, 1)].map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        {reason && (
          <p className="pt-2 text-xs text-stone-600 leading-relaxed border-t border-stone-100 mt-2">
            {reason}
          </p>
        )}
      </div>
    </Link>
  );
}
