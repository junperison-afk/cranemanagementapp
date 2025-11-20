"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";
import DatePicker from "@/components/common/date-picker";

interface FilterState {
  position?: string;
  companyId?: string;
  phone?: string;
  email?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

interface ContactFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactFilterPanel({ isOpen, onClose }: ContactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 初期値はsearchParamsから取得（初回マウント時に状態を事前に同期）
  const [filters, setFilters] = useState<FilterState>(() => ({
    position: searchParams.get("position") || "",
    companyId: searchParams.get("companyId") || "",
    phone: searchParams.get("phone") || "",
    email: searchParams.get("email") || "",
    updatedAfter: searchParams.get("updatedAfter") || "",
    updatedBefore: searchParams.get("updatedBefore") || "",
  }));

  // searchParamsからフィルター状態を同期（isOpenに関係なく実行）
  useEffect(() => {
    setFilters({
      position: searchParams.get("position") || "",
      companyId: searchParams.get("companyId") || "",
      phone: searchParams.get("phone") || "",
      email: searchParams.get("email") || "",
      updatedAfter: searchParams.get("updatedAfter") || "",
      updatedBefore: searchParams.get("updatedBefore") || "",
    });
  }, [searchParams]);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

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
    
    router.push(`/contacts?${params.toString()}`);
    setTimeout(() => {
      setIsApplying(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters({
      position: "",
      companyId: "",
      phone: "",
      email: "",
      updatedAfter: "",
      updatedBefore: "",
    });
    setCompanySearchQuery("");
    setSelectedCompany(null);
    setCompanySearchResults([]);
    setShowCompanyResults(false);
    // すべてのフィルターをクリア（searchも含む）
    // フィルターパネルを開いたままにする
    const params = new URLSearchParams();
    params.set("filter", "open");
    router.push(`/contacts?${params.toString()}`);
  };

  // hasActiveFiltersはFilterPanelBaseで自動判定されるため、削除

  return (
    <FilterPanelBase
      title="連絡先のフィルター"
      basePath="/contacts"
      searchPlaceholder="氏名、役職、電話、メールで検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      isApplying={isApplying}
    >
            {/* 役職 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                役職
              </label>
              <input
                type="text"
                placeholder="役職でフィルター"
                value={filters.position || ""}
                onChange={(e) =>
                  setFilters({ ...filters, position: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
                    // 少し遅延させて、クリックイベントを処理できるようにする
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

