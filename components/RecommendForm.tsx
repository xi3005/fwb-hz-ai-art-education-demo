"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artwork, UserPreference } from "@/lib/types";
import { THEMES, STYLES } from "@/lib/types";

type Result = {
  intro: string;
  source: "claude" | "kimi" | "fallback";
  picks: { artwork: Artwork; reason: string }[];
};

function sourceLabel(source: Result["source"]) {
  if (source === "kimi") return "Kimi K2.5";
  if (source === "claude") return "Claude Haiku 4.5";
  return "本地规则回退";
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-stone-700 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onChange(active ? value.filter((v) => v !== opt) : [...value, opt])
              }
              className={
                "px-2.5 py-1 text-xs rounded-md ring-1 transition-colors " +
                (active
                  ? "bg-stone-900 text-white ring-stone-900"
                  : "bg-white text-stone-700 ring-stone-300 hover:ring-stone-500")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecommendForm() {
  const [themes, setThemes] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const pref: UserPreference = { themes, styles, difficulty, freeText };
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(pref),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Result;
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[360px_1fr] gap-10">
      <form onSubmit={submit} className="space-y-5">
        <ChipGroup
          label="感兴趣的主题"
          options={THEMES}
          value={themes}
          onChange={setThemes}
        />
        <ChipGroup
          label="喜欢的风格"
          options={STYLES}
          value={styles}
          onChange={setStyles}
        />
        <div>
          <div className="text-sm font-medium text-stone-700 mb-2">
            学习难度：{difficulty}（1 入门 · 5 专业）
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <div className="text-sm font-medium text-stone-700 mb-2">
            想多说点什么（可选）
          </div>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            placeholder="如：我想了解中国古代山水画的代表作"
            className="w-full text-sm rounded-md ring-1 ring-stone-300 px-3 py-2 focus:outline-none focus:ring-stone-700"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-md bg-stone-900 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "AI 思考中…" : "为我推荐"}
        </button>
      </form>

      <div className="min-h-[200px]">
        {error && (
          <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">
            出错了：{error}
          </div>
        )}
        {!result && !error && !loading && (
          <div className="rounded-xl ring-1 ring-stone-200 bg-white p-6 text-sm text-stone-500">
            选择左侧偏好，点击“为我推荐”后，AI 会从作品库里挑出 3 件最合适的作品并附上推荐理由。
          </div>
        )}
        {loading && (
          <div className="rounded-xl ring-1 ring-stone-200 bg-white p-6 text-sm text-stone-500 animate-pulse">
            正在分析你的偏好与作品库 …
          </div>
        )}
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl ring-1 ring-stone-200 bg-white p-4">
              <div className="text-xs text-stone-400 mb-1">
                AI 引擎：{sourceLabel(result.source)}
              </div>
              <p className="text-sm text-stone-700">{result.intro}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.picks.map(({ artwork, reason }) => (
                <Link
                  key={artwork.id}
                  href={`/gallery/${artwork.id}`}
                  className="group flex flex-col rounded-xl overflow-hidden bg-white ring-1 ring-stone-200 hover:ring-stone-500 transition-all"
                >
                  <div className="relative aspect-[4/5] bg-stone-100">
                    <Image
                      src={artwork.image_url}
                      alt={artwork.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="font-medium leading-tight">{artwork.title}</div>
                    <div className="text-xs text-stone-500">
                      {artwork.artist}
                      {artwork.year ? ` · ${artwork.year}` : ""}
                    </div>
                    <p className="pt-2 text-xs text-stone-700 leading-relaxed">
                      {reason}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
