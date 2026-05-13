"use client";
import { useState } from "react";

export function LearningPath({ artworkId }: { artworkId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setText("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/learning-path", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: artworkId }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {text === "" && (
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-stone-900 text-white text-sm hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "正在生成…" : "✨ 生成 AI 学习导览"}
        </button>
      )}
      {error && (
        <div className="text-sm text-red-600">生成失败：{error}</div>
      )}
      {text && (
        <article className="prose prose-stone max-w-none whitespace-pre-wrap text-[15px] leading-7 text-stone-800">
          {text}
        </article>
      )}
      {text && !loading && (
        <button
          onClick={generate}
          className="text-xs text-stone-500 hover:text-stone-900 underline"
        >
          重新生成
        </button>
      )}
    </div>
  );
}
