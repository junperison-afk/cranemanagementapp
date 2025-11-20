import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UseFilterPanelOptions {
  /** ベースパス（例: "/projects", "/contacts"） */
  basePath: string;
  /** フィルター状態をクリアする関数 */
  onClearFilters?: () => void;
}

/**
 * フィルターパネルの共通ロジックを提供するカスタムフック
 */
export function useFilterPanel({ basePath, onClearFilters }: UseFilterPanelOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isApplying, setIsApplying] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * フィルターを適用する
   */
  const applyFilters = (searchValue: string, filters: Record<string, string>) => {
    setIsApplying(true);
    const params = new URLSearchParams();

    // フィルターパネルを開いたままにする
    params.set("filter", "open");

    // 全体検索の値を追加
    if (searchValue) {
      params.set("search", searchValue);
    }

    // フィルター値を追加
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // ページをリセット
    params.delete("page");

    // URLパラメータは非同期で更新（ページ全体の再レンダリングを避ける）
    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`);
    });
    setTimeout(() => {
      setIsApplying(false);
    }, 500);
  };

  /**
   * フィルターをクリアする
   */
  const clearFilters = () => {
    // カスタムクリア処理があれば実行
    if (onClearFilters) {
      onClearFilters();
    }

    // すべてのフィルターをクリア（searchも含む）
    // フィルターパネルを開いたままにする
    const params = new URLSearchParams();
    params.set("filter", "open");
    // URLパラメータは非同期で更新（ページ全体の再レンダリングを避ける）
    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`);
    });
  };

  return {
    applyFilters,
    clearFilters,
    isApplying,
    isPending,
  };
}

