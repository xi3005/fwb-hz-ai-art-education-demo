"use client";
import { useRef, useState } from "react";
import Image from "next/image";

type Tags = {
  theme: string[];
  style: string[];
  form: string;
  difficulty: number;
  source: "claude" | "kimi" | "fallback";
};

function sourceLabel(source: Tags["source"]) {
  if (source === "kimi") return "Kimi / Moonshot（多模态）";
  if (source === "claude") return "Claude Haiku 4.5（多模态）";
  return "本地回退";
}

export default function AdminPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [tags, setTags] = useState<Tags | null>(null);
  const [tagging, setTagging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(file: File) {
    setError(null);
    setTags(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function runAutoTag() {
    if (!preview) return;
    setTagging(true);
    setError(null);
    try {
      const res = await fetch("/api/tag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dataUrl: preview }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Tags;
      setTags(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTagging(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">内容管理（CMS）</h1>
        <p className="text-sm text-stone-500 mt-1 max-w-2xl">
          上传新作品图片，点击“AI 自动打标签”，由大模型读图后给出主题、风格、形式、难度四个字段，
          再由编辑人工复核入库。 —— 对应合同第一条第（3）款“数字艺术内容管理系统（CMS）开发与集成”。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onPick(f);
            }}
            className="aspect-[4/5] rounded-xl border-2 border-dashed border-stone-300 bg-white flex items-center justify-center cursor-pointer hover:border-stone-500 transition relative overflow-hidden"
          >
            {preview ? (
              <Image src={preview} alt="预览" fill className="object-cover" unoptimized />
            ) : (
              <div className="text-center text-sm text-stone-500">
                <div className="text-3xl mb-2">＋</div>
                点击或拖拽图片到这里
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="作品标题"
              className="text-sm rounded-md ring-1 ring-stone-300 px-3 py-2 focus:outline-none focus:ring-stone-700"
            />
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="作者"
              className="text-sm rounded-md ring-1 ring-stone-300 px-3 py-2 focus:outline-none focus:ring-stone-700"
            />
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={runAutoTag}
            disabled={!preview || tagging}
            className="w-full px-4 py-2.5 rounded-md bg-stone-900 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-50"
          >
            {tagging ? "AI 正在读图打标签…" : "✨ AI 自动打标签"}
          </button>

          {error && (
            <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">
              出错了：{error}
            </div>
          )}

          {tags && (
            <div className="rounded-xl ring-1 ring-stone-200 bg-white p-4 space-y-3">
              <div className="text-xs text-stone-400">
                AI 引擎：{sourceLabel(tags.source)}
              </div>
              <TagRow label="主题 theme" values={tags.theme} />
              <TagRow label="风格 style" values={tags.style} />
              <TagRow label="形式 form" values={[tags.form]} />
              <TagRow label="难度 difficulty" values={[`${tags.difficulty} / 5`]} />
              <button
                className="w-full mt-2 px-4 py-2 rounded-md bg-stone-100 text-stone-800 text-sm hover:bg-stone-200"
                onClick={() =>
                  alert(
                    "演示版未连 Supabase 写入。配置环境变量后即可保存。\n\n字段已通过 AI 完成自动结构化处理（对应合同第一条第（2）款）。",
                  )
                }
              >
                保存到作品库
              </button>
            </div>
          )}

          {!tags && (
            <div className="rounded-xl ring-1 ring-stone-200 bg-white p-6 text-sm text-stone-500">
              先选择一张图片，再点击上方按钮，AI 将自动给出多维标签。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TagRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-stone-500 w-24 shrink-0">{label}</div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span
            key={v}
            className="text-xs px-2 py-0.5 bg-stone-900 text-white rounded"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
