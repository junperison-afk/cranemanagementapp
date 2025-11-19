"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";
import DatePicker from "@/components/common/date-picker";

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    postalCode: searchParams.get("postalCode") || "",
    address: searchParams.get("address") || "",
    phone: searchParams.get("phone") || "",
    email: searchParams.get("email") || "",
    updatedAfter: searchParams.get("updatedAfter") || "",
    updatedBefore: searchParams.get("updatedBefore") || "",
  });
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const applyFilters = (searchValue: string) => {
    setIsApplying(true);
    const params = new URLSearchParams();
    
    // フィルターパネルを開いたままにする
    params.set("filter", "open");
    
    // 全体検索の値を追加
    if (searchValue) {
      params.set("search", searchValue);
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // ページをリセット
    params.delete("page");
    
    router.push(`/companies?${params.toString()}`);
    // ナビゲーション完了後に状態をリセット（実際のナビゲーション完了を待つため少し遅延）
    setTimeout(() => {
      setIsApplying(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters({
      postalCode: "",
      address: "",
      phone: "",
      email: "",
      updatedAfter: "",
      updatedBefore: "",
    });
    // すべてのフィルターをクリア（searchも含む）
    // フィルターパネルを開いたままにする
    const params = new URLSearchParams();
    params.set("filter", "open");
    router.push(`/companies?${params.toString()}`);
  };

  // hasActiveFiltersはFilterPanelBaseで自動判定されるため、削除

  if (!isOpen) return null;

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

