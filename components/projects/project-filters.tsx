"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";
import DatePicker from "@/components/common/date-picker";
import { useFilterPanel } from "@/hooks/use-filter-panel";

interface FilterState {
  status?: string;
  companyId?: string;
  assignedUserId?: string;
  amount?: string;
  equipmentCount?: string;
  startDateAfter?: string;
  startDateBefore?: string;
  endDateAfter?: string;
  endDateBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

interface ProjectFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectFilterPanel({ isOpen, onClose }: ProjectFiltersProps) {
  const searchParams = useSearchParams();

  // 初期値はsearchParamsから取得（初回マウント時に状態を事前に同期）
  // コンポーネントは常にマウントされているため、useStateの初期化のみで十分
  const [filters, setFilters] = useState<FilterState>(() => ({
    status: searchParams.get("status") || "",
    companyId: searchParams.get("companyId") || "",
    assignedUserId: searchParams.get("assignedUserId") || "",
    amount: searchParams.get("amount") || "",
    equipmentCount: searchParams.get("equipmentCount") || "",
    startDateAfter: searchParams.get("startDateAfter") || "",
    startDateBefore: searchParams.get("startDateBefore") || "",
    endDateAfter: searchParams.get("endDateAfter") || "",
    endDateBefore: searchParams.get("endDateBefore") || "",
    updatedAfter: searchParams.get("updatedAfter") || "",
    updatedBefore: searchParams.get("updatedBefore") || "",
  }));

  // searchParams変更時のみフィルター状態を同期（初回マウント時はuseStateの初期化で処理済み）
  useEffect(() => {
    const newFilters: FilterState = {
      status: searchParams.get("status") || "",
      companyId: searchParams.get("companyId") || "",
      assignedUserId: searchParams.get("assignedUserId") || "",
      amount: searchParams.get("amount") || "",
      equipmentCount: searchParams.get("equipmentCount") || "",
      startDateAfter: searchParams.get("startDateAfter") || "",
      startDateBefore: searchParams.get("startDateBefore") || "",
      endDateAfter: searchParams.get("endDateAfter") || "",
      endDateBefore: searchParams.get("endDateBefore") || "",
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
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [showCompanyResults, setShowCompanyResults] = useState(false);

  // フィルターパネルの共通ロジック
  const { applyFilters: applyFiltersBase, clearFilters: clearFiltersBase, isApplying } = useFilterPanel({
    basePath: "/projects",
    onClearFilters: () => {
      setFilters({
        status: "",
        companyId: "",
        assignedUserId: "",
        amount: "",
        equipmentCount: "",
        startDateAfter: "",
        startDateBefore: "",
        endDateAfter: "",
        endDateBefore: "",
        updatedAfter: "",
        updatedBefore: "",
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
    // FilterStateをRecord<string, string>に変換（オプショナルプロパティを文字列に変換）
    const filtersRecord: Record<string, string> = {
      status: filters.status || "",
      companyId: filters.companyId || "",
      assignedUserId: filters.assignedUserId || "",
      amount: filters.amount || "",
      equipmentCount: filters.equipmentCount || "",
      startDateAfter: filters.startDateAfter || "",
      startDateBefore: filters.startDateBefore || "",
      endDateAfter: filters.endDateAfter || "",
      endDateBefore: filters.endDateBefore || "",
      updatedAfter: filters.updatedAfter || "",
      updatedBefore: filters.updatedBefore || "",
    };
    applyFiltersBase(searchValue, filtersRecord);
  };

  const clearFilters = () => {
    clearFiltersBase();
  };

  // hasActiveFiltersはFilterPanelBaseで自動判定されるため、削除

  return (
    <FilterPanelBase
      title="プロジェクトのフィルター"
      basePath="/projects"
      searchPlaceholder="プロジェクトタイトル、備考、取引先名で検索..."
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
                <option value="PLANNING">計画中</option>
                <option value="IN_PROGRESS">進行中</option>
                <option value="ON_HOLD">保留</option>
                <option value="COMPLETED">完了</option>
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

            {/* 担当者ID */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                担当者ID
              </label>
              <input
                type="text"
                placeholder="担当者IDでフィルター"
                value={filters.assignedUserId}
                onChange={(e) =>
                  setFilters({ ...filters, assignedUserId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 開始日 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <DatePicker
                    value={filters.startDateAfter || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        startDateAfter: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <DatePicker
                    value={filters.startDateBefore || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        startDateBefore: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
              </div>
            </div>

            {/* 終了日 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <DatePicker
                    value={filters.endDateAfter || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        endDateAfter: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <DatePicker
                    value={filters.endDateBefore || undefined}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        endDateBefore: value,
                      })
                    }
                    placeholder="日付を選択"
                  />
                </div>
              </div>
            </div>

            {/* 金額 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                金額
              </label>
              <input
                type="number"
                placeholder="金額でフィルター"
                value={filters.amount || ""}
                onChange={(e) =>
                  setFilters({ ...filters, amount: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 機器数 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                機器数
              </label>
              <input
                type="number"
                placeholder="機器数でフィルター"
                value={filters.equipmentCount || ""}
                onChange={(e) =>
                  setFilters({ ...filters, equipmentCount: e.target.value })
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

