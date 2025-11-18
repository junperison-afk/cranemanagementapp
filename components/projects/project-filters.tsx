"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";

interface FilterState {
  status?: string;
  companyId?: string;
  assignedUserId?: string;
  startDateAfter?: string;
  startDateBefore?: string;
  endDateAfter?: string;
  endDateBefore?: string;
}

interface ProjectFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectFilterPanel({ isOpen, onClose }: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get("status") || "",
    companyId: searchParams.get("companyId") || "",
    assignedUserId: searchParams.get("assignedUserId") || "",
    startDateAfter: searchParams.get("startDateAfter") || "",
    startDateBefore: searchParams.get("startDateBefore") || "",
    endDateAfter: searchParams.get("endDateAfter") || "",
    endDateBefore: searchParams.get("endDateBefore") || "",
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

    router.push(`/projects?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      companyId: "",
      assignedUserId: "",
      startDateAfter: "",
      startDateBefore: "",
      endDateAfter: "",
      endDateBefore: "",
    });
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`/projects?${params.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  if (!isOpen) return null;

  return (
    <FilterPanelBase
      title="プロジェクトのフィルター"
      basePath="/projects"
      searchPlaceholder="プロジェクトタイトル、備考、取引先名で検索..."
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
                <option value="PLANNING">計画中</option>
                <option value="IN_PROGRESS">進行中</option>
                <option value="ON_HOLD">保留</option>
                <option value="COMPLETED">完了</option>
              </select>
            </div>

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

            {/* 担当者ID */}
            <div>
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 開始日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <input
                    type="date"
                    value={filters.startDateAfter}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        startDateAfter: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <input
                    type="date"
                    value={filters.startDateBefore}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        startDateBefore: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 終了日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以降</label>
                  <input
                    type="date"
                    value={filters.endDateAfter}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        endDateAfter: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">以前</label>
                  <input
                    type="date"
                    value={filters.endDateBefore}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        endDateBefore: e.target.value,
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

