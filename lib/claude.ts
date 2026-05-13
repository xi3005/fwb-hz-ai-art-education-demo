import Anthropic from "@anthropic-ai/sdk";
import type { Artwork, UserPreference } from "./types";
import {
  RECOMMEND_SYSTEM,
  TAG_SYSTEM,
  buildLearningPathPrompt,
  buildRecommendUserMessage,
} from "./prompts";

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export type RecommendResult = {
  intro: string;
  picks: { id: string; reason: string }[];
  source: "claude" | "fallback";
};

export async function recommendArtworks(
  pref: UserPreference,
  library: Artwork[],
): Promise<RecommendResult> {
  if (!hasAnthropicKey()) {
    return fallbackRecommend(pref, library);
  }
  try {
    const msg = await client().messages.create({
      model: HAIKU,
      max_tokens: 800,
      system: [
        {
          type: "text",
          text: RECOMMEND_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildRecommendUserMessage(pref, library) }],
    });
    const text = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");
    const json = JSON.parse(stripFences(text));
    return {
      intro: String(json.intro ?? "为你推荐："),
      picks: (json.picks ?? []).slice(0, 3).map((p: { id: string; reason: string }) => ({
        id: String(p.id),
        reason: String(p.reason),
      })),
      source: "claude",
    };
  } catch (err) {
    console.error("[recommend] claude failed, falling back", err);
    return fallbackRecommend(pref, library);
  }
}

export async function autoTag(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<{
  theme: string[];
  style: string[];
  form: string;
  difficulty: number;
  source: "claude" | "fallback";
}> {
  if (!hasAnthropicKey()) {
    return { theme: ["人物"], style: ["现代主义"], form: "油画", difficulty: 2, source: "fallback" };
  }
  try {
    const msg = await client().messages.create({
      model: HAIKU,
      max_tokens: 300,
      system: TAG_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: "请按 system 提示给这张图打标签，只返回 JSON。" },
          ],
        },
      ],
    });
    const text = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");
    const json = JSON.parse(stripFences(text));
    return {
      theme: Array.isArray(json.theme) ? json.theme : [String(json.theme)],
      style: Array.isArray(json.style) ? json.style : [String(json.style)],
      form: String(json.form ?? "油画"),
      difficulty: Number(json.difficulty ?? 2),
      source: "claude",
    };
  } catch (err) {
    console.error("[autoTag] claude failed, falling back", err);
    return { theme: ["人物"], style: ["现代主义"], form: "油画", difficulty: 2, source: "fallback" };
  }
}

export async function streamLearningPath(artwork: Artwork): Promise<ReadableStream<Uint8Array>> {
  const prompt = buildLearningPathPrompt(artwork);
  const encoder = new TextEncoder();

  if (!hasAnthropicKey()) {
    return new ReadableStream({
      async start(controller) {
        for (const chunk of fallbackLearningPath(artwork)) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise((r) => setTimeout(r, 35));
        }
        controller.close();
      },
    });
  }

  const stream = await client().messages.stream({
    model: SONNET,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[learningPath] stream error", err);
        controller.error(err);
      }
    },
  });
}

// --- Fallbacks (no API key) ---

function stripFences(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function fallbackRecommend(pref: UserPreference, library: Artwork[]): RecommendResult {
  const score = (a: Artwork) => {
    let s = 0;
    if (pref.themes.some((t) => a.theme.includes(t))) s += 3;
    if (pref.styles.some((st) => a.style.includes(st))) s += 3;
    s -= Math.abs(a.difficulty - pref.difficulty);
    return s;
  };
  const picks = [...library]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
    .map((a) => ({
      id: a.id,
      reason: `《${a.title}》主题为 ${a.theme.join("/")}，风格 ${a.style.join("/")}，难度 ${a.difficulty} 级，与你的偏好接近。`,
    }));
  return {
    intro: "（演示模式：未配置 ANTHROPIC_API_KEY，使用本地规则匹配。）",
    picks,
    source: "fallback",
  };
}

function fallbackLearningPath(a: Artwork): string[] {
  const text = `**创作背景**\n《${a.title}》由${a.artist}创作于${a.year ?? "未知年份"}。这是${a.style.join("、")}时期的代表性作品之一，反映了当时的艺术潮流与时代背景。\n\n**技法要点**\n本作主要采用${a.form}形式呈现。仔细观察画面的笔触、色调与构图，可以体会到艺术家在表达${a.theme.join("、")}时所运用的视觉手段。\n\n**观察重点**\n初次观看时，请先将视线放在画面中心，再沿着主要轮廓线扫视全局。注意明暗对比与色彩分布是如何引导你的视觉路径的。\n\n**同类作品**\n你可以一并欣赏同属${a.style[0]}的其他作品，对比它们在主题、构图与情绪表达上的异同，建立横向认知。\n\n**练习建议**\n建议用 15 分钟做一份"视觉笔记"：徒手画出画面的简化轮廓，标记主要色块；再写 3 句话描述你感受到的氛围。这一过程会显著加深你对作品结构的理解。\n\n（演示模式：未配置 ANTHROPIC_API_KEY，本段为本地模板回退。）`;
  // chunk into pseudo-streaming pieces
  const result: string[] = [];
  const step = 6;
  for (let i = 0; i < text.length; i += step) {
    result.push(text.slice(i, i + step));
  }
  return result;
}
