"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";

interface FilterState {
  status?: string;
  companyId?: string;
  occurredAfter?: string;
  occurredBefore?: string;
}

interface SalesOpportunityFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalesOpportunityFilterPanel({
  isOpen,
  onClose,
}: SalesOpportunityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get("status") || "",
    companyId: searchParams.get("companyId") || "",
    occurredAfter: searchParams.get("occurredAfter") || "",
    occurredBefore: searchParams.get("occurredBefore") || "",
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

    router.push(`/sales-opportunities?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      companyId: "",
      occurredAfter: "",
      occurredBefore: "",
    });
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`/sales-opportunities?${params.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  if (!isOpen) return null;

  return (
    <FilterPanelBase
      title="営業案件のフィルター"
      basePath="/sales-opportunities"
      searchPlaceholder="案件タイトル、クレーン情報、備考、取引先名で検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
    >
            {/* ステータス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="ESTIMATING">見積中</option>
                <option value="WON">受注</option>
                <option value="LOST">失注</option>
              </select>
            </div>

            {/* 取引先ID（将来的に取引先選択コンポーネントに置き換え可能） */}
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

            {/* 発生日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                発生日
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <input
                    type="date"
                    value={filters.occurredAfter}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        occurredAfter: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <input
                    type="date"
                    value={filters.occurredBefore}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        occurredBefore: e.target.value,
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

