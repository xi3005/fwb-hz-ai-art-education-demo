export type Artwork = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  image_url: string;
  description: string;
  theme: string[];
  style: string[];
  form: string;
  difficulty: number;
};

export type UserPreference = {
  themes: string[];
  styles: string[];
  difficulty: number;
  freeText?: string;
};

export type Recommendation = {
  artwork: Artwork;
  reason: string;
};

export const THEMES = [
  "山水",
  "人物",
  "花鸟",
  "宗教",
  "神话",
  "日常生活",
  "梦境",
  "都市",
  "自然",
  "静物",
  "抽象",
] as const;

export const STYLES = [
  "中国传统",
  "文艺复兴",
  "巴洛克",
  "印象派",
  "后印象派",
  "表现主义",
  "立体主义",
  "超现实主义",
  "抽象艺术",
  "波普艺术",
  "现代主义",
] as const;

export const FORMS = ["油画", "国画", "水彩", "版画", "书法", "雕塑", "数字艺术"] as const;
