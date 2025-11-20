"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";
import DatePicker from "@/components/common/date-picker";
import { useFilterPanel } from "@/hooks/use-filter-panel";

interface FilterState {
  postalCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

interface CompanyFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyFilterPanel({ isOpen, onClose }: CompanyFiltersProps) {
  const searchParams = useSearchParams();

  // 初期値はsearchParamsから取得（初回マウント時に状態を事前に同期）
  // コンポーネントは常にマウントされているため、useStateの初期化のみで十分
  const [filters, setFilters] = useState<FilterState>(() => ({
    postalCode: searchParams.get("postalCode") || "",
    address: searchParams.get("address") || "",
    phone: searchParams.get("phone") || "",
    email: searchParams.get("email") || "",
    updatedAfter: searchParams.get("updatedAfter") || "",
    updatedBefore: searchParams.get("updatedBefore") || "",
  }));

  // searchParams変更時のみフィルター状態を同期（初回マウント時はuseStateの初期化で処理済み）
  useEffect(() => {
    const newFilters: FilterState = {
      postalCode: searchParams.get("postalCode") || "",
      address: searchParams.get("address") || "",
      phone: searchParams.get("phone") || "",
      email: searchParams.get("email") || "",
      updatedAfter: searchParams.get("updatedAfter") || "",
      updatedBefore: searchParams.get("updatedBefore") || "",
    };
    
    // 状態が実際に変更された場合のみ更新（不要な再レンダリングを避ける）
    setFilters((prevFilters) => {
      const hasChanged = Object.keys(newFilters).some(
        (key) => prevFilters[key as keyof FilterState] !== newFilters[key as keyof FilterState]
      );
      return hasChanged ? newFilters : prevFilters;
    });
  }, [searchParams]);
  // フィルターパネルの共通ロジック
  const { applyFilters: applyFiltersBase, clearFilters: clearFiltersBase, isApplying } = useFilterPanel({
    basePath: "/companies",
    onClearFilters: () => {
      setFilters({
        postalCode: "",
        address: "",
        phone: "",
        email: "",
        updatedAfter: "",
        updatedBefore: "",
      });
    },
  });

  const applyFilters = (searchValue: string) => {
    applyFiltersBase(searchValue, filters);
  };

  const clearFilters = () => {
    clearFiltersBase();
  };

  // hasActiveFiltersはFilterPanelBaseで自動判定されるため、削除

  return (
    <FilterPanelBase
      title="取引先のフィルター"
      basePath="/companies"
      searchPlaceholder="会社名、住所、メールで検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      isApplying={isApplying}
    >
            {/* 郵便番号 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                郵便番号
              </label>
              <input
                type="text"
                placeholder="郵便番号でフィルター"
                value={filters.postalCode || ""}
                onChange={(e) =>
                  setFilters({ ...filters, postalCode: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 住所 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                住所
              </label>
              <input
                type="text"
                placeholder="住所でフィルター"
                value={filters.address || ""}
                onChange={(e) =>
                  setFilters({ ...filters, address: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 電話番号 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                type="text"
                placeholder="電話番号でフィルター"
                value={filters.phone || ""}
                onChange={(e) =>
                  setFilters({ ...filters, phone: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* メール */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メール
              </label>
              <input
                type="text"
                placeholder="メールでフィルター"
                value={filters.email || ""}
                onChange={(e) =>
                  setFilters({ ...filters, email: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 更新日 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                更新日
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <DatePicker
                    value={filters.updatedAfter || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        updatedAfter: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <DatePicker
                    value={filters.updatedBefore || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        updatedBefore: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
              </div>
            </div>
    </FilterPanelBase>
  );
}

