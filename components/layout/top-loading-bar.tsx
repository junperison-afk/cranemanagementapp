"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathnameRef = useRef<string>(pathname);
  const isLoadingRef = useRef<boolean>(false);

  // ローディングを開始する関数
  const startLoading = () => {
    // 既にローディング中の場合はリセット
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setProgress(0);

    // アニメーションを開始（左から右へ）
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 70) {
          return 70; // 70%で一旦停止（実際のロード完了を待つ）
        }
        // 徐々に進行（最初は速く、後半は遅く）
        const increment = prev < 50 ? 15 : prev < 65 ? 8 : 3;
        return Math.min(prev + increment, 70);
      });
    }, 100);
  };

  // リンククリックを検知してローディングを開始
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]");
      
      // Next.jsのLinkコンポーネントまたは通常のaタグを検知
      if (link && link.getAttribute("href")?.startsWith("/")) {
        // 外部リンクやアンカーリンクは除外
        const href = link.getAttribute("href");
        if (href && !href.startsWith("http") && !href.startsWith("#")) {
          startLoading();
        }
      }
    };

    // カスタムイベント（プログラム的な遷移）をリッスン
    const handleNavigationStart = () => {
      startLoading();
    };

    // リンククリックイベントをリッスン
    document.addEventListener("click", handleLinkClick, true);
    // カスタムイベントをリッスン
    window.addEventListener("navigation:start", handleNavigationStart);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
      window.removeEventListener("navigation:start", handleNavigationStart);
    };
  }, []);

  // パスが変更されたら、ローディングを70%で停止（データ読み込み完了を待つ）
  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      
      // パス変更時は70%で停止したまま（データ読み込み完了を待つ）
      // データ読み込み完了は "page:content:loaded" イベントで通知される
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pathname]);

  // データコンテンツの読み込み完了をリッスン
  useEffect(() => {
    const handleContentLoaded = () => {
      if (isLoadingRef.current) {
        // ローディングを完了
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setProgress(100);
        timerRef.current = setTimeout(() => {
          isLoadingRef.current = false;
          setIsLoading(false);
          setProgress(0);
        }, 200); // 100%表示後に少し待ってから非表示
      }
    };

    window.addEventListener("page:content:loaded", handleContentLoaded);

    return () => {
      window.removeEventListener("page:content:loaded", handleContentLoaded);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-blue-600 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

