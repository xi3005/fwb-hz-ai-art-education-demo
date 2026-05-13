import type { Artwork } from "./types";
import { SEED_ARTWORKS, findById } from "./artworks-data";
import { hasSupabaseConfig, supabaseServer } from "./supabase";

export async function listArtworks(): Promise<Artwork[]> {
  if (hasSupabaseConfig()) {
    const sb = await supabaseServer();
    const { data, error } = await sb!
      .from("artworks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) return data as Artwork[];
  }
  return SEED_ARTWORKS;
}

export async function getArtwork(id: string): Promise<Artwork | null> {
  if (hasSupabaseConfig()) {
    const sb = await supabaseServer();
    const { data } = await sb!.from("artworks").select("*").eq("id", id).single();
    if (data) return data as Artwork;
  }
  return findById(id) ?? null;
}
