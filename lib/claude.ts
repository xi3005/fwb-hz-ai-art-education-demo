import Anthropic from "@anthropic-ai/sdk";
import type { Artwork, UserPreference } from "./types";
import {
  TAG_SYSTEM,
  buildLearningPathPrompt,
} from "./prompts";

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";
const KIMI_BASE_URL = process.env.KIMI_BASE_URL ?? "https://api.moonshot.cn/v1";
const KIMI_MODEL = process.env.KIMI_MODEL ?? "moonshot-v1-8k-vision-preview";

type AiSource = "claude" | "kimi" | "fallback";
type ChatMessage = {
  role: "system" | "user";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function hasKimiKey() {
  return Boolean(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY);
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

async function kimiChat(messages: ChatMessage[], maxTokens: number, stream = false) {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error("missing Kimi API key");

  const res = await fetch(`${KIMI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 1,
      stream,
    }),
  });

  if (!res.ok) {
    throw new Error(`Kimi API ${res.status}: ${await res.text()}`);
  }
  return res;
}

async function kimiText(messages: ChatMessage[], maxTokens: number) {
  const res = await kimiChat(messages, maxTokens);
  const data = await res.json();
  const message = data.choices?.[0]?.message;
  return String(message?.content || message?.reasoning_content || "");
}

export type RecommendResult = {
  intro: string;
  picks: { id: string; reason: string }[];
  source: AiSource;
};

export async function recommendArtworks(
  pref: UserPreference,
  library: Artwork[],
): Promise<RecommendResult> {
  const rankedPicks = rankRecommendPicks(pref, library);

  if (hasKimiKey()) {
    return {
      intro: buildRecommendationIntro(pref),
      picks: rankedPicks,
      source: "kimi",
    };
  }

  if (!hasAnthropicKey()) {
    return fallbackRecommend(pref, library, rankedPicks);
  }

  return {
    intro: buildRecommendationIntro(pref),
    picks: rankedPicks,
    source: "claude",
  };
}

export async function autoTag(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<{
  theme: string[];
  style: string[];
  form: string;
  difficulty: number;
  source: AiSource;
}> {
  if (hasKimiKey()) {
    try {
      const text = await kimiText(
        [
          { role: "system", content: TAG_SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mediaType};base64,${imageBase64}` },
              },
              { type: "text", text: "请按 system 提示给这张图打标签，只返回 JSON。" },
            ],
          },
        ],
        1000,
      );
      const json = parseJsonObject(text);
      return {
        theme: Array.isArray(json.theme) ? json.theme : [String(json.theme)],
        style: Array.isArray(json.style) ? json.style : [String(json.style)],
        form: String(json.form ?? "油画"),
        difficulty: Number(json.difficulty ?? 2),
        source: "kimi",
      };
    } catch (err) {
      console.error("[autoTag] kimi failed, falling back", err);
      return { theme: ["人物"], style: ["现代主义"], form: "油画", difficulty: 2, source: "fallback" };
    }
  }

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
    const json = parseJsonObject(text);
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

  if (hasKimiKey()) {
    try {
      const res = await kimiChat([{ role: "user", content: prompt }], 1200, true);
      const body = res.body;
      if (!body) throw new Error("Kimi stream response has no body");

      return new ReadableStream({
        async start(controller) {
          const reader = body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const payload = trimmed.slice(5).trim();
                if (payload === "[DONE]") continue;
                const json = JSON.parse(payload);
                const text = json.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(String(text)));
              }
            }
            controller.close();
          } catch (err) {
            console.error("[learningPath] kimi stream error", err);
            controller.error(err);
          }
        },
      });
    } catch (err) {
      console.error("[learningPath] kimi failed, falling back", err);
    }
  }

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

function parseJsonObject(text: string) {
  const stripped = stripFences(text);
  try {
    return JSON.parse(stripped);
  } catch {
    const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced.trim());

    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(stripped.slice(start, end + 1));
    }
    throw new Error("No JSON object found in model response");
  }
}

function fallbackRecommend(
  pref: UserPreference,
  library: Artwork[],
  picks = rankRecommendPicks(pref, library),
): RecommendResult {
  return {
    intro: hasKimiKey() || hasAnthropicKey()
      ? buildRecommendationIntro(pref)
      : "（演示模式：未配置 Kimi/Claude API key，使用本地规则匹配。）",
    picks,
    source: "fallback",
  };
}

function rankRecommendPicks(pref: UserPreference, library: Artwork[]) {
  const scored = library
    .map((artwork) => ({ artwork, score: scoreArtwork(artwork, pref) }))
    .sort((a, b) => b.score - a.score || a.artwork.difficulty - b.artwork.difficulty)
    .slice(0, 3);

  return scored.map(({ artwork, score }, index) => ({
    id: artwork.id,
    reason: buildLocalReason(artwork, pref, score, index),
  }));
}

function scoreArtwork(artwork: Artwork, pref: UserPreference) {
  const exactThemeHits = pref.themes.filter((theme) => artwork.theme.includes(theme));
  const exactStyleHits = pref.styles.filter((style) => artwork.style.includes(style));
  const relatedThemeHits = pref.themes.filter((theme) =>
    artwork.theme.some((artTheme) => relatedThemes(theme).includes(artTheme)),
  );
  const relatedStyleHits = pref.styles.filter((style) =>
    artwork.style.some((artStyle) => relatedStyles(style).includes(artStyle)),
  );
  const textHits = freeTextHits(artwork, pref.freeText ?? "");
  const difficultyGap = Math.abs(artwork.difficulty - pref.difficulty);

  return (
    exactStyleHits.length * 48 +
    exactThemeHits.length * 36 +
    relatedStyleHits.length * 24 +
    relatedThemeHits.length * 12 +
    Math.max(0, 16 - difficultyGap * 5) +
    textHits * 8
  );
}

function relatedStyles(style: string) {
  const map: Record<string, string[]> = {
    印象派: ["后印象派", "现代主义"],
    后印象派: ["印象派", "表现主义", "现代主义"],
    现代主义: ["后印象派", "表现主义", "抽象艺术", "立体主义", "超现实主义"],
    中国传统: ["印象派"],
    巴洛克: ["文艺复兴"],
    文艺复兴: ["巴洛克"],
    抽象艺术: ["现代主义", "立体主义"],
  };
  return map[style] ?? [];
}

function relatedThemes(theme: string) {
  const map: Record<string, string[]> = {
    自然: ["花鸟", "山水", "梦境", "静物"],
    花鸟: ["自然", "静物"],
    山水: ["自然"],
    静物: ["花鸟", "日常生活"],
    人物: ["日常生活", "神话", "宗教"],
    日常生活: ["人物", "都市", "静物"],
    都市: ["日常生活", "人物"],
    梦境: ["自然", "神话", "抽象"],
    神话: ["人物", "宗教", "梦境"],
    抽象: ["梦境"],
  };
  return map[theme] ?? [];
}

function freeTextHits(artwork: Artwork, freeText: string) {
  const terms = freeText
    .split(/[\s,，。；;、]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
  if (!terms.length) return 0;

  const haystack = [
    artwork.title,
    artwork.artist,
    artwork.description,
    artwork.theme.join(" "),
    artwork.style.join(" "),
    artwork.form,
  ].join(" ");

  return terms.filter((term) => haystack.includes(term)).length;
}

function buildLocalReason(artwork: Artwork, pref: UserPreference, score: number, index: number) {
  const exactThemes = pref.themes.filter((theme) => artwork.theme.includes(theme));
  const exactStyles = pref.styles.filter((style) => artwork.style.includes(style));
  const relatedStylesHit = pref.styles.filter((style) =>
    artwork.style.some((artStyle) => relatedStyles(style).includes(artStyle)),
  );
  const relatedThemesHit = pref.themes.filter((theme) =>
    artwork.theme.some((artTheme) => relatedThemes(theme).includes(artTheme)),
  );
  const difficultyGap = Math.abs(artwork.difficulty - pref.difficulty);

  const matchParts: string[] = [];
  if (exactThemes.length) matchParts.push(`主题命中“${exactThemes.join("、")}”`);
  if (exactStyles.length) matchParts.push(`风格命中“${exactStyles.join("、")}”`);
  if (!exactStyles.length && relatedStylesHit.length) {
    matchParts.push(`可作为“${relatedStylesHit.join("、")}”的相邻风格对照`);
  }
  if (!exactThemes.length && relatedThemesHit.length) {
    matchParts.push(`题材与“${relatedThemesHit.join("、")}”相邻`);
  }
  if (difficultyGap === 0) {
    matchParts.push(`难度 ${artwork.difficulty} 正好适配`);
  } else if (difficultyGap === 1) {
    matchParts.push(`难度 ${artwork.difficulty} 与目标只相差一级，适合延展`);
  }

  const learningPoint = learningPointFor(artwork);
  const prefix = index === 0 ? "首推" : score >= 70 ? "继续推荐" : "作为补充";
  return `${prefix}《${artwork.title}》：${matchParts.join("，") || "与当前偏好接近"}。${learningPoint}`;
}

function learningPointFor(artwork: Artwork) {
  const text = `${artwork.description} ${artwork.style.join(" ")} ${artwork.theme.join(" ")}`;
  if (text.includes("后印象派")) return "它能帮助学习者从印象派的光色走向更强烈的笔触、结构和情绪表达。";
  if (text.includes("印象派")) return "它适合用来观察光色变化、短笔触和画面氛围如何共同成立。";
  if (text.includes("中国传统")) return "它适合讲构图、留白、线条节奏以及东方图像如何影响现代视觉。";
  if (text.includes("巴洛克")) return "它适合学习戏剧化明暗、人物关系和观看视线的组织方式。";
  if (text.includes("文艺复兴")) return "它适合入门理解比例、线条、空间和古典叙事。";
  if (text.includes("抽象")) return "它适合训练从形状、色块和节奏进入作品，而不是只寻找具体对象。";
  return "它适合从构图、色彩和主题表达三个维度做入门观察。";
}

function buildRecommendationIntro(pref: UserPreference) {
  const themes = pref.themes.length ? pref.themes.join("、") : "开放主题";
  const styles = pref.styles.length ? pref.styles.join("、") : "多种风格";
  return `我按“${themes} / ${styles} / 难度 ${pref.difficulty}”做了匹配，优先选择命中度高、学习路径清晰的作品。`;
}

function fallbackLearningPath(a: Artwork): string[] {
  const text = `**创作背景**\n《${a.title}》由${a.artist}创作于${a.year ?? "未知年份"}。这是${a.style.join("、")}时期的代表性作品之一，反映了当时的艺术潮流与时代背景。\n\n**技法要点**\n本作主要采用${a.form}形式呈现。仔细观察画面的笔触、色调与构图，可以体会到艺术家在表达${a.theme.join("、")}时所运用的视觉手段。\n\n**观察重点**\n初次观看时，请先将视线放在画面中心，再沿着主要轮廓线扫视全局。注意明暗对比与色彩分布是如何引导你的视觉路径的。\n\n**同类作品**\n你可以一并欣赏同属${a.style[0]}的其他作品，对比它们在主题、构图与情绪表达上的异同，建立横向认知。\n\n**练习建议**\n建议用 15 分钟做一份"视觉笔记"：徒手画出画面的简化轮廓，标记主要色块；再写 3 句话描述你感受到的氛围。这一过程会显著加深你对作品结构的理解。\n\n（演示模式：未配置 Kimi/Claude API key，本段为本地模板回退。）`;
  // chunk into pseudo-streaming pieces
  const result: string[] = [];
  const step = 6;
  for (let i = 0; i < text.length; i += step) {
    result.push(text.slice(i, i + step));
  }
  return result;
}
