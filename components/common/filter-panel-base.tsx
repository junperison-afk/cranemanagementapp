"use client";

import { ReactNode, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface FilterPanelBaseProps {
  title: string;
  basePath: string;
  searchPlaceholder: string;
  onClose: () => void;
  children: ReactNode;
  onApply: (searchValue: string) => void;
  onClear: () => void;
  isApplying?: boolean;
}

export default function FilterPanelBase({
  title,
  basePath,
  searchPlaceholder,
  onClose,
  children,
  onApply,
  onClear,
  isApplying = false,
}: FilterPanelBaseProps) {
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  // アクティブなフィルターがあるかどうかを判定（searchパラメータも含む）
  // searchValue（入力中の値）とsearchParams（適用済みの値）の両方を確認
  const hasActiveFilters = useMemo(() => {
    // 入力中の検索値がある場合
    if (searchValue.trim().length > 0) {
      return true;
    }
    
    // URLパラメータにフィルターがあるか確認（page, limit, filterは除外）
    const hasUrlFilters = Array.from(searchParams.keys()).some(
      (key) => key !== "page" && key !== "limit" && key !== "filter" && searchParams.get(key)
    );
    
    return hasUrlFilters;
  }, [searchValue, searchParams]);

  const handleApply = () => {
    onApply(searchValue);
  };

  const handleClear = () => {
    setSearchValue("");
    onClear();
  };

  return (
    <div className="w-80 bg-white border border-gray-200 flex flex-col h-full">
      {/* フィルターパネルヘッダー */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* フィルターコンテンツ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 全体検索 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            全体検索
          </label>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 項目別のフィルター */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            項目別のフィルター
          </h3>
          <div className="flex flex-wrap gap-3">{children}</div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? "適用中..." : "適用"}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              disabled={isApplying}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              クリア
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

