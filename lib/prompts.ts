import type { Artwork, UserPreference } from "./types";
import { THEMES, STYLES, FORMS } from "./types";

export const RECOMMEND_SYSTEM = `你是面向中文用户的艺术教育推荐引擎。你的工作是基于用户偏好和作品库，挑选 3 件最匹配的作品。

输出严格 JSON，结构为：
{"picks": [{"id": "<artwork_id>", "reason": "<1-2句中文推荐理由，面向初学者>"}], "intro": "<1句开场白，概括整体推荐思路>"}

要求：
- 必须从作品库中选 id，不能编造
- 推荐 3 件，按匹配度排序
- reason 要具体，能呼应用户偏好里的某个点
- 不要任何 JSON 以外的文字`;

export const TAG_SYSTEM = `你是艺术作品自动打标签助手。看图后从以下可选标签里挑选并以严格 JSON 返回：
{"theme": string[1-2], "style": string[1], "form": string, "difficulty": number}

可选 theme: ${THEMES.join("、")}
可选 style: ${STYLES.join("、")}
可选 form: ${FORMS.join("、")}
difficulty: 1（入门）到 5（专业）的整数

只输出 JSON。`;

export function buildLibraryContext(library: Artwork[]) {
  return JSON.stringify(
    library.map((a) => ({
      id: a.id,
      title: a.title,
      artist: a.artist,
      year: a.year,
      theme: a.theme,
      style: a.style,
      form: a.form,
      difficulty: a.difficulty,
      summary: a.description.slice(0, 80),
    })),
  );
}

export function buildRecommendUserMessage(pref: UserPreference, library: Artwork[]) {
  return `用户偏好：
- 感兴趣的主题：${pref.themes.join("、") || "不限"}
- 喜欢的风格：${pref.styles.join("、") || "不限"}
- 学习难度（1-5）：${pref.difficulty}
- 自由描述：${pref.freeText || "无"}

作品库（JSON）：
${buildLibraryContext(library)}`;
}

export function buildLearningPathPrompt(artwork: Artwork) {
  return `请为以下艺术作品生成一份面向难度 ${artwork.difficulty} 级学习者的五段式赏析。

作品：《${artwork.title}》
作者：${artwork.artist}
年代：${artwork.year ?? "未知"}
风格：${artwork.style.join("、")}
形式：${artwork.form}
基础信息：${artwork.description}

请用纯中文输出，分五段，每段 2-3 句，依次为：
1. **创作背景**：作者生平与时代环境
2. **技法要点**：用了什么技法、为什么有效
3. **观察重点**：观看时应该把视线先放到哪里
4. **同类作品**：风格相近、可一并欣赏的 2 件作品
5. **练习建议**：学习者可以做什么动手练习来理解这件作品

不要使用 Markdown 列表语法，每段用一个粗体小标题开头即可。`;
}
