import Link from "next/link";
import Image from "next/image";
import { listArtworks } from "@/lib/artworks";

export default async function Home() {
  const artworks = (await listArtworks()).slice(0, 6);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block text-xs px-2 py-1 rounded bg-stone-900 text-white tracking-wider">
              杭州尚斯文化创意 · 项目演示
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              AI 人工智能<br />艺术教育系统
            </h1>
            <p className="text-stone-600 leading-7 max-w-md">
              通过人工智能算法、数字内容管理与系统集成，构建覆盖
              <strong className="text-stone-900">“内容管理 · 智能推荐 · 学习导览”</strong>
              的艺术教育平台。 本页面是 Demo 版，演示主线功能与数据结构。
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/recommend"
                className="px-5 py-2.5 rounded-md bg-stone-900 text-white text-sm font-medium hover:bg-stone-700"
              >
                体验 AI 推荐 →
              </Link>
              <Link
                href="/gallery"
                className="px-5 py-2.5 rounded-md ring-1 ring-stone-300 text-stone-800 text-sm font-medium hover:bg-stone-100"
              >
                浏览作品库
              </Link>
              <Link
                href="/admin"
                className="px-5 py-2.5 rounded-md ring-1 ring-stone-300 text-stone-800 text-sm font-medium hover:bg-stone-100"
              >
                CMS 后台
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {artworks.map((a, i) => (
              <Link
                key={a.id}
                href={`/gallery/${a.id}`}
                className={
                  "relative aspect-[3/4] rounded-md overflow-hidden bg-stone-200 " +
                  (i === 1 ? "translate-y-6" : "") +
                  (i === 4 ? " translate-y-6" : "")
                }
              >
                <Image
                  src={a.image_url}
                  alt={a.title}
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover hover:scale-[1.03] transition-transform"
                  unoptimized
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 grid md:grid-cols-3 gap-8">
          {[
            {
              title: "数字艺术内容管理",
              body: "标准化的作品库与多维标签（主题/风格/形式/难度），支持上传、AI 打标签、检索调用。",
              ref: "合同第一条第（3）款",
            },
            {
              title: "AI 智能推荐",
              body: "结合用户偏好与作品库特征，由大模型生成个性化的 3 件作品推荐与理由。",
              ref: "合同第一条第（2）款",
            },
            {
              title: "AI 学习导览",
              body: "针对单件作品生成五段式赏析：背景、技法、观察、同类、练习建议。",
              ref: "合同第一条第（2）款 · 推荐与匹配方法",
            },
          ].map((f) => (
            <div key={f.title} className="space-y-2">
              <div className="text-xs text-stone-400 tracking-wider">{f.ref}</div>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm text-stone-600 leading-6">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
