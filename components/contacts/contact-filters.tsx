"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";

interface FilterState {
  companyId?: string;
}

interface ContactFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactFilterPanel({ isOpen, onClose }: ContactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    companyId: searchParams.get("companyId") || "",
  });
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // 取引先一覧を取得
    fetch("/api/companies?limit=1000")
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          setCompanies(data.companies);
        }
      })
      .catch((error) => {
        console.error("取引先取得エラー:", error);
      });
  }, []);

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
    
    router.push(`/contacts?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      companyId: "",
    });
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`/contacts?${params.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  if (!isOpen) return null;

  return (
    <FilterPanelBase
      title="連絡先のフィルター"
      basePath="/contacts"
      searchPlaceholder="氏名、役職、電話、メールで検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
    >
            {/* 取引先 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                取引先
              </label>
              <select
                value={filters.companyId}
                onChange={(e) =>
                  setFilters({ ...filters, companyId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
    </FilterPanelBase>
  );
}

