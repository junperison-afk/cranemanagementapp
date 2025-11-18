"use client";

import { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface FilterPanelBaseProps {
  title: string;
  basePath: string;
  searchPlaceholder: string;
  onClose: () => void;
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export default function FilterPanelBase({
  title,
  basePath,
  searchPlaceholder,
  onClose,
  children,
  onApply,
  onClear,
  hasActiveFilters,
}: FilterPanelBaseProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        {/* 検索 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            検索
          </label>
          <input
            type="text"
            placeholder={searchPlaceholder}
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set("search", e.target.value);
              } else {
                params.delete("search");
              }
              params.delete("page");
              router.push(`${basePath}?${params.toString()}`);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 標準のフィルター */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            標準のフィルター
          </h3>
          <div className="space-y-3">{children}</div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onApply}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            適用
          </button>
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              クリア
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

