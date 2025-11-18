"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";

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

  if (!isOpen) return null;

  return (
    <FilterPanelBase
      title="取引先のフィルター"
      basePath="/companies"
      searchPlaceholder="会社名、住所、メールで検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
    >
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
    </FilterPanelBase>
  );
}

