"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface FilterState {
  companyId?: string;
  projectId?: string;
}

interface EquipmentFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EquipmentFilterButton({
  onToggle,
  activeFilterCount,
}: {
  onToggle: () => void;
  activeFilterCount: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <FunnelIcon className="h-5 w-5" />
      フィルター
      {activeFilterCount > 0 && (
        <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}

export function EquipmentFilterPanel({
  isOpen,
  onClose,
}: EquipmentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    companyId: searchParams.get("companyId") || "",
    projectId: searchParams.get("projectId") || "",
  });

  if (!isOpen) return null;

  const applyFilters = () => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // 検索パラメータを保持
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }

    // ページをリセット
    params.delete("page");

    router.push(`/equipment?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      companyId: "",
      projectId: "",
    });
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`/equipment?${params.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* フィルターパネルヘッダー */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">機器のフィルター</h2>
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
            placeholder="機器名称、機種、製造番号、設置場所、備考、取引先名で検索..."
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set("search", e.target.value);
              } else {
                params.delete("search");
              }
              params.delete("page");
              router.push(`/equipment?${params.toString()}`);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 標準のフィルター */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            標準のフィルター
          </h3>
          <div className="space-y-3">
            {/* 取引先ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                取引先ID
              </label>
              <input
                type="text"
                placeholder="取引先IDでフィルター"
                value={filters.companyId}
                onChange={(e) =>
                  setFilters({ ...filters, companyId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* プロジェクトID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクトID
              </label>
              <input
                type="text"
                placeholder="プロジェクトIDでフィルター"
                value={filters.projectId}
                onChange={(e) =>
                  setFilters({ ...filters, projectId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={applyFilters}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            適用
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
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

