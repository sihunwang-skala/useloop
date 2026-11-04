import type { Metadata } from "next";
import { Footer, Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UseLoop — 솔직한 피드백과 새로운 서비스 발견", template: "%s · UseLoop" },
  description: "쓰고 있는 서비스에 솔직한 피드백을 남기고, 새로운 스타트업 서비스를 자유롭게 발견하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">본문 바로가기</a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
