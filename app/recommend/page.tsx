import { RecommendForm } from "@/components/RecommendForm";

export const metadata = { title: "AI 推荐 · 艺术教育系统" };

export default function RecommendPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">AI 推荐</h1>
        <p className="text-sm text-stone-500 mt-1 max-w-2xl">
          根据你选择的主题、风格、学习难度和自由描述，
          系统会调用大模型对作品库进行内容匹配，挑出 3 件最契合的作品并给出推荐理由。
          —— 对应合同第一条第（2）款“人工智能内容处理与应用模块”。
        </p>
      </div>
      <RecommendForm />
    </div>
  );
}
