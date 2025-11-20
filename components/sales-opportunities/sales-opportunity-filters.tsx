"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";
import DatePicker from "@/components/common/date-picker";
import { useFilterPanel } from "@/hooks/use-filter-panel";

interface FilterState {
  status?: string;
  companyId?: string;
  estimatedAmount?: string;
  craneCount?: string;
  estimateCount?: string;
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
  const searchParams = useSearchParams();

  // 初期値はsearchParamsから取得（初回マウント時に状態を事前に同期）
  // コンポーネントは常にマウントされているため、useStateの初期化のみで十分
  const [filters, setFilters] = useState<FilterState>(() => ({
    status: searchParams.get("status") || "",
    companyId: searchParams.get("companyId") || "",
    estimatedAmount: searchParams.get("estimatedAmount") || "",
    craneCount: searchParams.get("craneCount") || "",
    estimateCount: searchParams.get("estimateCount") || "",
    occurredAfter: searchParams.get("occurredAfter") || "",
    occurredBefore: searchParams.get("occurredBefore") || "",
  }));

  // searchParams変更時のみフィルター状態を同期（初回マウント時はuseStateの初期化で処理済み）
  useEffect(() => {
    const newFilters: FilterState = {
      status: searchParams.get("status") || "",
      companyId: searchParams.get("companyId") || "",
      estimatedAmount: searchParams.get("estimatedAmount") || "",
      craneCount: searchParams.get("craneCount") || "",
      estimateCount: searchParams.get("estimateCount") || "",
      occurredAfter: searchParams.get("occurredAfter") || "",
      occurredBefore: searchParams.get("occurredBefore") || "",
    };
    
    // 状態が実際に変更された場合のみ更新（不要な再レンダリングを避ける）
    setFilters((prevFilters) => {
      const hasChanged = Object.keys(newFilters).some(
        (key) => prevFilters[key as keyof FilterState] !== newFilters[key as keyof FilterState]
      );
      return hasChanged ? newFilters : prevFilters;
    });
  }, [searchParams]);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [showCompanyResults, setShowCompanyResults] = useState(false);

  // フィルターパネルの共通ロジック
  const { applyFilters: applyFiltersBase, clearFilters: clearFiltersBase, isApplying } = useFilterPanel({
    basePath: "/sales-opportunities",
    onClearFilters: () => {
      setFilters({
        status: "",
        companyId: "",
        estimatedAmount: "",
        craneCount: "",
        estimateCount: "",
        occurredAfter: "",
        occurredBefore: "",
      });
      setCompanySearchQuery("");
      setSelectedCompany(null);
      setCompanySearchResults([]);
      setShowCompanyResults(false);
    },
  });

  // 選択された取引先の名前を初期化
  useEffect(() => {
    if (!isOpen) return;
    const companyId = searchParams.get("companyId");
    if (companyId) {
      fetch(`/api/companies/${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            setSelectedCompany({ id: data.id, name: data.name });
            setCompanySearchQuery(data.name);
          }
        })
        .catch((error) => {
          console.error("取引先取得エラー:", error);
        });
    }
  }, [searchParams, isOpen]);

  // 取引先のリアルタイム検索
  useEffect(() => {
    if (!isOpen) return;
    if (companySearchQuery.trim().length === 0) {
      setCompanySearchResults([]);
      setShowCompanyResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(`/api/companies?search=${encodeURIComponent(companySearchQuery)}&limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (data.companies) {
            setCompanySearchResults(data.companies);
            setShowCompanyResults(true);
          }
        })
        .catch((error) => {
          console.error("取引先検索エラー:", error);
        });
    }, 300); // 300msのデバウンス

    return () => clearTimeout(timeoutId);
  }, [companySearchQuery, isOpen]);

  const applyFilters = (searchValue: string) => {
    applyFiltersBase(searchValue, filters);
  };

  const clearFilters = () => {
    clearFiltersBase();
  };

  // hasActiveFiltersはFilterPanelBaseで自動判定されるため、削除

  return (
    <FilterPanelBase
      title="営業案件のフィルター"
      basePath="/sales-opportunities"
      searchPlaceholder="案件タイトル、クレーン情報、備考、取引先名で検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      isApplying={isApplying}
    >
            {/* ステータス */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="ESTIMATING">見積中</option>
                <option value="WON">受注</option>
                <option value="LOST">失注</option>
              </select>
            </div>

            {/* 取引先 */}
            <div className="flex-1 min-w-[200px] relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                取引先
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="取引先名で検索..."
                  value={companySearchQuery}
                  onChange={(e) => {
                    setCompanySearchQuery(e.target.value);
                    if (selectedCompany && e.target.value !== selectedCompany.name) {
                      setSelectedCompany(null);
                      setFilters({ ...filters, companyId: "" });
                    }
                  }}
                  onFocus={() => {
                    if (companySearchQuery.trim().length > 0 && companySearchResults.length > 0) {
                      setShowCompanyResults(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowCompanyResults(false);
                    }, 200);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {showCompanyResults && companySearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {companySearchResults.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => {
                          setSelectedCompany(company);
                          setCompanySearchQuery(company.name);
                          setFilters({ ...filters, companyId: company.id });
                          setShowCompanyResults(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                )}
                {showCompanyResults && companySearchQuery.trim().length > 0 && companySearchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
                    該当する取引先が見つかりません
                  </div>
                )}
              </div>
            </div>

            {/* 発生日 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                発生日
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <DatePicker
                    value={filters.occurredAfter || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        occurredAfter: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <DatePicker
                    value={filters.occurredBefore || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        occurredBefore: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
              </div>
            </div>

            {/* 想定金額 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                想定金額
              </label>
              <input
                type="number"
                placeholder="想定金額でフィルター"
                value={filters.estimatedAmount || ""}
                onChange={(e) =>
                  setFilters({ ...filters, estimatedAmount: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* クレーン台数 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                クレーン台数
              </label>
              <input
                type="number"
                placeholder="クレーン台数でフィルター"
                value={filters.craneCount || ""}
                onChange={(e) =>
                  setFilters({ ...filters, craneCount: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 見積数 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                見積数
              </label>
              <input
                type="number"
                placeholder="見積数でフィルター"
                value={filters.estimateCount || ""}
                onChange={(e) =>
                  setFilters({ ...filters, estimateCount: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
    </FilterPanelBase>
  );
}

