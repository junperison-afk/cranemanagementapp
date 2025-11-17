import type { Metadata } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import TopLoadingBar from "@/components/layout/top-loading-bar";

export const metadata: Metadata = {
  title: "クレーン管理システム",
  description: "天井クレーンの点検業務を一元管理するWebシステム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <TopLoadingBar />
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}

