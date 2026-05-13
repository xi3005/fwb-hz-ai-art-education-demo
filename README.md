# AI 人工智能艺术教育系统 · Demo

杭州尚斯文化创意 × 苏州星梦互动 · 一天冲刺版 Demo（对应合同金额 80 万元、合同期 2025-12-11 至 2026-12-31）。

本仓库是合同所述系统的**最小演示闭环**：作品库 + AI 推荐 + AI 学习导览 + AI 自动打标签 CMS。

---

## 演示动线（给甲方看的 3 分钟）

1. **首页** `/` — 一句话讲清"内容管理 · 智能推荐 · 学习导览"三件事，对应合同技术目标。
2. **AI 推荐** `/recommend` — 选主题/风格/难度 → 3 秒内得到 3 件作品 + 推荐理由 → 对应**合同第一条第（2）款**"人工智能内容处理与应用模块"。
3. **作品详情** `/gallery/[id]` → 点 "生成 AI 学习导览" → 流式吐出 5 段赏析 → 对应**合同第一条第（2）款**的"智能匹配与推荐方法 / 内容结构化处理"。
4. **CMS 后台** `/admin` → 拖一张新作品图 → 点 "AI 自动打标签" → 主题/风格/形式/难度 4 个字段自动填好 → 对应**合同第一条第（3）款**"数字艺术内容管理系统（CMS）开发与集成"。
5. **数据库** Supabase / 本地种子 — 给甲方看一下 `artworks` 表结构，主题/风格/形式/难度四字段刚好对应**合同第一条第（2）款**中"多维度内容特征定义"。

---

## 合同条款 ↔ 代码地图

| 合同条款 | 实现位置 |
|---|---|
| 第一条第（1）款 系统架构 | `app/`（前端）+ `app/api/`（后端）+ `supabase/migrations/0001_init.sql`（数据库） |
| 第一条第（2）款 AI 内容处理 | `lib/claude.ts`、`lib/prompts.ts`、`app/api/{recommend,tag,learning-path}/route.ts` |
| 第一条第（3）款 数字艺术 CMS | `app/admin/page.tsx`、`app/api/tag/route.ts` |
| 第一条第（4）款 API 接口 | `app/api/*/route.ts`（统一 JSON / SSE 接口） |
| 第一条第（5）款 测试部署 | `npm run build` + Vercel 部署 |

---

## 运行

```bash
npm install
cp .env.example .env.local   # 三组 key 都可选；不填也能跑（走本地回退）
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 启用真实 AI（推荐）

在 `.env.local` 中填入：

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

- 推荐 / 自动打标签：Claude Haiku 4.5（`claude-haiku-4-5-20251001`）
- 学习导览：Claude Sonnet 4.6（`claude-sonnet-4-6`，流式）
- system prompt 启用 prompt caching，缓存 5 分钟，重复调用近似免费

未配置时，所有 AI 调用走本地规则回退，演示仍可完整跑通。

### 启用 Supabase 持久化（可选）

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

然后在 Supabase SQL 编辑器里依次执行：

```
supabase/migrations/0001_init.sql
supabase/seed.sql
```

未配置时，数据源退化为 `lib/artworks-data.ts` 中的 17 件本地种子作品。

---

## 技术栈

- **Next.js 16** App Router + TypeScript + Tailwind v4
- **Supabase**（Postgres + RLS）— 可选
- **Anthropic Claude SDK** — Haiku 4.5（推荐/打标签）+ Sonnet 4.6（学习导览流式）

---

## 当前 Demo 明确未做（合同里有，留后续版本）

- 用户注册/登录、权限角色控制
- 第三方平台对接（合同第一条第（4）款外部对接部分）
- 真正的 ML 模型训练（用 Claude API 模拟"基础机器学习/规则增强模型"）
- 等保 2.0 测评（合同第十二条验收要求，对接测试阶段补齐）
- 单元测试、CI/CD
