"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";

interface FilterState {
  companyId?: string;
  projectId?: string;
}

interface EquipmentFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EquipmentFilterPanel({
  isOpen,
  onClose,
}: EquipmentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    companyId: searchParams.get("companyId") || "",
    projectId: searchParams.get("projectId") || "",
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

    router.push(`/equipment?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      companyId: "",
      projectId: "",
    });
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`/equipment?${params.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  if (!isOpen) return null;

  return (
    <FilterPanelBase
      title="機器のフィルター"
      basePath="/equipment"
      searchPlaceholder="機器名称、機種、製造番号、設置場所、備考、取引先名で検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
    >
            {/* 取引先ID */}
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

            {/* プロジェクトID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクトID
              </label>
              <input
                type="text"
                placeholder="プロジェクトIDでフィルター"
                value={filters.projectId}
                onChange={(e) =>
                  setFilters({ ...filters, projectId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
    </FilterPanelBase>
  );
}

