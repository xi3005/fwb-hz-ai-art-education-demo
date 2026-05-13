import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "尚斯 · AI 艺术教育系统",
  description: "AI 人工智能艺术教育系统信息集成与应用 — 杭州尚斯文化创意",
};

const nav = [
  { href: "/", label: "首页" },
  { href: "/gallery", label: "作品库" },
  { href: "/recommend", label: "AI 推荐" },
  { href: "/admin", label: "内容管理" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 bg-white/70 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              尚斯 <span className="text-stone-400">·</span> AI 艺术教育
            </Link>
            <nav className="flex gap-1 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-md hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 mt-16 py-6 text-center text-xs text-stone-500">
          AI 人工智能艺术教育系统信息集成与应用 · Demo Build · {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
