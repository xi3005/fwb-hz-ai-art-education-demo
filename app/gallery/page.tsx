import { ArtCard } from "@/components/ArtCard";
import { listArtworks } from "@/lib/artworks";
import { hasSupabaseConfig } from "@/lib/supabase";

export const metadata = {
  title: "作品库 · AI 艺术教育",
};

export default async function GalleryPage() {
  const artworks = await listArtworks();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">作品库</h1>
          <p className="text-sm text-stone-500 mt-1">
            共 {artworks.length} 件作品 · 数据源：
            {hasSupabaseConfig() ? "Supabase Postgres" : "本地种子数据"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artworks.map((a) => (
          <ArtCard key={a.id} artwork={a} />
        ))}
      </div>
    </div>
  );
}
