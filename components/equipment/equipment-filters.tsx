"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";
import DatePicker from "@/components/common/date-picker";
import { useFilterPanel } from "@/hooks/use-filter-panel";

interface FilterState {
  model?: string;
  serialNumber?: string;
  location?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

interface EquipmentFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EquipmentFilterPanel({
  isOpen,
  onClose,
}: EquipmentFiltersProps) {
  const searchParams = useSearchParams();

  // 初期値はsearchParamsから取得（初回マウント時に状態を事前に同期）
  // コンポーネントは常にマウントされているため、useStateの初期化のみで十分
  const [filters, setFilters] = useState<FilterState>(() => ({
    model: searchParams.get("model") || "",
    serialNumber: searchParams.get("serialNumber") || "",
    location: searchParams.get("location") || "",
    updatedAfter: searchParams.get("updatedAfter") || "",
    updatedBefore: searchParams.get("updatedBefore") || "",
  }));

  // searchParams変更時のみフィルター状態を同期（初回マウント時はuseStateの初期化で処理済み）
  useEffect(() => {
    const newFilters: FilterState = {
      model: searchParams.get("model") || "",
      serialNumber: searchParams.get("serialNumber") || "",
      location: searchParams.get("location") || "",
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
    basePath: "/equipment",
    onClearFilters: () => {
      setFilters({
        model: "",
        serialNumber: "",
        location: "",
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
      title="機器のフィルター"
      basePath="/equipment"
      searchPlaceholder="機器名称、機種、製造番号、設置場所、備考、取引先名で検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      isApplying={isApplying}
    >
            {/* 機種・型式 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                機種・型式
              </label>
              <input
                type="text"
                placeholder="機種・型式でフィルター"
                value={filters.model || ""}
                onChange={(e) =>
                  setFilters({ ...filters, model: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 製造番号 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                製造番号
              </label>
              <input
                type="text"
                placeholder="製造番号でフィルター"
                value={filters.serialNumber || ""}
                onChange={(e) =>
                  setFilters({ ...filters, serialNumber: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 設置場所 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                設置場所
              </label>
              <input
                type="text"
                placeholder="設置場所でフィルター"
                value={filters.location || ""}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
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

