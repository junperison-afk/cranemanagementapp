"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface FilterState {
  industryType?: string;
  billingFlag?: string;
  hasSalesOpportunities?: string;
  hasProjects?: string;
  hasEquipment?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

interface CompanyFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyFilterButton({
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

export function CompanyFilterPanel({ isOpen, onClose }: CompanyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    industryType: searchParams.get("industryType") || "",
    billingFlag: searchParams.get("billingFlag") || "",
    hasSalesOpportunities: searchParams.get("hasSalesOpportunities") || "",
    hasProjects: searchParams.get("hasProjects") || "",
    hasEquipment: searchParams.get("hasEquipment") || "",
    updatedAfter: searchParams.get("updatedAfter") || "",
    updatedBefore: searchParams.get("updatedBefore") || "",
  });

  if (!isOpen) return null;

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // ページをリセット
    params.delete("page");
    
    router.push(`/companies?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      industryType: "",
      billingFlag: "",
      hasSalesOpportunities: "",
      hasProjects: "",
      hasEquipment: "",
      updatedAfter: "",
      updatedBefore: "",
    });
    router.push("/companies");
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* フィルターパネルヘッダー */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          取引先のフィルター
        </h2>
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
            placeholder="会社名、住所、メールで検索..."
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set("search", e.target.value);
              } else {
                params.delete("search");
              }
              params.delete("page");
              router.push(`/companies?${params.toString()}`);
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
            {/* 業種 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業種
              </label>
              <input
                type="text"
                placeholder="業種でフィルター"
                value={filters.industryType}
                onChange={(e) =>
                  setFilters({ ...filters, industryType: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 請求フラグ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                請求フラグ
              </label>
              <select
                value={filters.billingFlag}
                onChange={(e) =>
                  setFilters({ ...filters, billingFlag: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>

            {/* 関連情報の有無 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                関連情報
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasSalesOpportunities === "true"}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        hasSalesOpportunities: e.target.checked ? "true" : "",
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    営業案件あり
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasProjects === "true"}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        hasProjects: e.target.checked ? "true" : "",
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    プロジェクトあり
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasEquipment === "true"}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        hasEquipment: e.target.checked ? "true" : "",
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">機器あり</span>
                </label>
              </div>
            </div>

            {/* 更新日時 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                更新日時
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <input
                    type="date"
                    value={filters.updatedAfter}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        updatedAfter: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <input
                    type="date"
                    value={filters.updatedBefore}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        updatedBefore: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
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

