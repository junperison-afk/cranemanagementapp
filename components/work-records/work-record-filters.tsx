"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";

interface FilterState {
  equipmentId?: string;
  userId?: string;
  workType?: string;
  overallJudgment?: string;
  inspectionDateAfter?: string;
  inspectionDateBefore?: string;
}

interface WorkRecordFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkRecordFilterPanel({
  isOpen,
  onClose,
}: WorkRecordFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    equipmentId: searchParams.get("equipmentId") || "",
    userId: searchParams.get("userId") || "",
    workType: searchParams.get("workType") || "",
    overallJudgment: searchParams.get("overallJudgment") || "",
    inspectionDateAfter: searchParams.get("inspectionDateAfter") || "",
    inspectionDateBefore: searchParams.get("inspectionDateBefore") || "",
  });

  const [equipmentList, setEquipmentList] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);

  useEffect(() => {
    // 機器一覧を取得
    fetch("/api/equipment?limit=1000")
      .then((res) => res.json())
      .then((data) => {
        if (data.equipment) {
          setEquipmentList(data.equipment);
        }
      })
      .catch((error) => {
        console.error("機器取得エラー:", error);
      });

    // ユーザー一覧を取得
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch((error) => {
        console.error("ユーザー取得エラー:", error);
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

    router.push(`/work-records?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      equipmentId: "",
      userId: "",
      workType: "",
      overallJudgment: "",
      inspectionDateAfter: "",
      inspectionDateBefore: "",
    });
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`/work-records?${params.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <FilterPanelBase
      title="作業記録のフィルター"
      basePath="/work-records"
      searchPlaceholder="所見、結果サマリ、機器名、担当者名で検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
    >
      {/* 機器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          機器
        </label>
        <select
          value={filters.equipmentId}
          onChange={(e) =>
            setFilters({ ...filters, equipmentId: e.target.value })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">すべて</option>
          {equipmentList.map((equipment) => (
            <option key={equipment.id} value={equipment.id}>
              {equipment.name}
            </option>
          ))}
        </select>
      </div>

      {/* 担当者 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          担当者
        </label>
        <select
          value={filters.userId}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">すべて</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
      </div>

      {/* 作業タイプ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          作業タイプ
        </label>
        <select
          value={filters.workType}
          onChange={(e) =>
            setFilters({ ...filters, workType: e.target.value })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">すべて</option>
          <option value="INSPECTION">点検</option>
          <option value="REPAIR">修理</option>
          <option value="MAINTENANCE">メンテナンス</option>
          <option value="OTHER">その他</option>
        </select>
      </div>

      {/* 総合判定 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          総合判定
        </label>
        <select
          value={filters.overallJudgment}
          onChange={(e) =>
            setFilters({ ...filters, overallJudgment: e.target.value })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">すべて</option>
          <option value="GOOD">良好</option>
          <option value="CAUTION">注意</option>
          <option value="BAD">不良</option>
          <option value="REPAIR">要修理</option>
        </select>
      </div>

      {/* 作業日 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作業日
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">以降</label>
            <input
              type="date"
              value={filters.inspectionDateAfter}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  inspectionDateAfter: e.target.value,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">以前</label>
            <input
              type="date"
              value={filters.inspectionDateBefore}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  inspectionDateBefore: e.target.value,
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

