"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanelBase from "@/components/common/filter-panel-base";
import DatePicker from "@/components/common/date-picker";

interface FilterState {
  equipmentId?: string;
  userId?: string;
  workType?: string;
  overallJudgment?: string;
  findings?: string;
  resultSummary?: string;
  inspectionDateAfter?: string;
  inspectionDateBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
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
    findings: searchParams.get("findings") || "",
    resultSummary: searchParams.get("resultSummary") || "",
    inspectionDateAfter: searchParams.get("inspectionDateAfter") || "",
    inspectionDateBefore: searchParams.get("inspectionDateBefore") || "",
    updatedAfter: searchParams.get("updatedAfter") || "",
    updatedBefore: searchParams.get("updatedBefore") || "",
  });
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState("");
  const [equipmentSearchResults, setEquipmentSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<{ id: string; name: string } | null>(null);
  const [showEquipmentResults, setShowEquipmentResults] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [showUserResults, setShowUserResults] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // 選択された機器の名前を初期化
  useEffect(() => {
    const equipmentId = searchParams.get("equipmentId");
    if (equipmentId) {
      fetch(`/api/equipment/${equipmentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            setSelectedEquipment({ id: data.id, name: data.name });
            setEquipmentSearchQuery(data.name);
          }
        })
        .catch((error) => {
          console.error("機器取得エラー:", error);
        });
    }
  }, [searchParams]);

  // 選択されたユーザーの名前を初期化
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      fetch(`/api/users/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            setSelectedUser({ id: data.id, name: data.name, email: data.email });
            setUserSearchQuery(data.name || data.email);
          }
        })
        .catch((error) => {
          console.error("ユーザー取得エラー:", error);
        });
    }
  }, [searchParams]);

  // 機器のリアルタイム検索
  useEffect(() => {
    if (equipmentSearchQuery.trim().length === 0) {
      setEquipmentSearchResults([]);
      setShowEquipmentResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(`/api/equipment?search=${encodeURIComponent(equipmentSearchQuery)}&limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (data.equipment) {
            setEquipmentSearchResults(data.equipment);
            setShowEquipmentResults(true);
          }
        })
        .catch((error) => {
          console.error("機器検索エラー:", error);
        });
    }, 300); // 300msのデバウンス

    return () => clearTimeout(timeoutId);
  }, [equipmentSearchQuery]);

  // ユーザーのリアルタイム検索
  useEffect(() => {
    if (userSearchQuery.trim().length === 0) {
      setUserSearchResults([]);
      setShowUserResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(`/api/users?search=${encodeURIComponent(userSearchQuery)}&limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            setUserSearchResults(data.users);
            setShowUserResults(true);
          }
        })
        .catch((error) => {
          console.error("ユーザー検索エラー:", error);
        });
    }, 300); // 300msのデバウンス

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery]);

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

    router.push(`/work-records?${params.toString()}`);
    setTimeout(() => {
      setIsApplying(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters({
      equipmentId: "",
      userId: "",
      workType: "",
      overallJudgment: "",
      findings: "",
      resultSummary: "",
      inspectionDateAfter: "",
      inspectionDateBefore: "",
      updatedAfter: "",
      updatedBefore: "",
    });
    setEquipmentSearchQuery("");
    setSelectedEquipment(null);
    setEquipmentSearchResults([]);
    setShowEquipmentResults(false);
    setUserSearchQuery("");
    setSelectedUser(null);
    setUserSearchResults([]);
    setShowUserResults(false);
    // すべてのフィルターをクリア（searchも含む）
    // フィルターパネルを開いたままにする
    const params = new URLSearchParams();
    params.set("filter", "open");
    router.push(`/work-records?${params.toString()}`);
  };

  // hasActiveFiltersはFilterPanelBaseで自動判定されるため、削除

  return (
    <FilterPanelBase
      title="作業記録のフィルター"
      basePath="/work-records"
      searchPlaceholder="所見、結果サマリ、機器名、担当者名で検索..."
      onClose={onClose}
      onApply={applyFilters}
      onClear={clearFilters}
      isApplying={isApplying}
    >
      {/* 機器 */}
      <div className="flex-1 min-w-[200px] relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          機器
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="機器名で検索..."
            value={equipmentSearchQuery}
            onChange={(e) => {
              setEquipmentSearchQuery(e.target.value);
              if (selectedEquipment && e.target.value !== selectedEquipment.name) {
                setSelectedEquipment(null);
                setFilters({ ...filters, equipmentId: "" });
              }
            }}
            onFocus={() => {
              if (equipmentSearchQuery.trim().length > 0 && equipmentSearchResults.length > 0) {
                setShowEquipmentResults(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowEquipmentResults(false);
              }, 200);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {showEquipmentResults && equipmentSearchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {equipmentSearchResults.map((equipment) => (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => {
                    setSelectedEquipment(equipment);
                    setEquipmentSearchQuery(equipment.name);
                    setFilters({ ...filters, equipmentId: equipment.id });
                    setShowEquipmentResults(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {equipment.name}
                </button>
              ))}
            </div>
          )}
          {showEquipmentResults && equipmentSearchQuery.trim().length > 0 && equipmentSearchResults.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
              該当する機器が見つかりません
            </div>
          )}
        </div>
      </div>

      {/* 担当者 */}
      <div className="flex-1 min-w-[200px] relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          担当者
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="担当者名で検索..."
            value={userSearchQuery}
            onChange={(e) => {
              setUserSearchQuery(e.target.value);
              if (selectedUser && e.target.value !== (selectedUser.name || selectedUser.email)) {
                setSelectedUser(null);
                setFilters({ ...filters, userId: "" });
              }
            }}
            onFocus={() => {
              if (userSearchQuery.trim().length > 0 && userSearchResults.length > 0) {
                setShowUserResults(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowUserResults(false);
              }, 200);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {showUserResults && userSearchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {userSearchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(user);
                    setUserSearchQuery(user.name || user.email);
                    setFilters({ ...filters, userId: user.id });
                    setShowUserResults(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {user.name || user.email}
                </button>
              ))}
            </div>
          )}
          {showUserResults && userSearchQuery.trim().length > 0 && userSearchResults.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
              該当する担当者が見つかりません
            </div>
          )}
        </div>
      </div>

      {/* 作業タイプ */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          作業タイプ
        </label>
        <select
          value={filters.workType}
          onChange={(e) =>
            setFilters({ ...filters, workType: e.target.value })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">すべて</option>
          <option value="INSPECTION">点検</option>
          <option value="REPAIR">修理</option>
          <option value="MAINTENANCE">メンテナンス</option>
          <option value="OTHER">その他</option>
        </select>
      </div>

      {/* 総合判定 */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          総合判定
        </label>
        <select
          value={filters.overallJudgment}
          onChange={(e) =>
            setFilters({ ...filters, overallJudgment: e.target.value })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">すべて</option>
          <option value="GOOD">良好</option>
          <option value="CAUTION">注意</option>
          <option value="BAD">不良</option>
          <option value="REPAIR">要修理</option>
        </select>
      </div>

      {/* 作業日 */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作業日
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">以降</label>
            <DatePicker
              value={filters.inspectionDateAfter || undefined}
              onChange={(value) =>
                setFilters({
                  ...filters,
                  inspectionDateAfter: value,
                })
              }
              placeholder="日付を選択"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">以前</label>
            <DatePicker
              value={filters.inspectionDateBefore || undefined}
              onChange={(value) =>
                setFilters({
                  ...filters,
                  inspectionDateBefore: value,
                })
              }
              placeholder="日付を選択"
            />
          </div>
        </div>
      </div>

      {/* 所見 */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          所見
        </label>
        <input
          type="text"
          placeholder="所見でフィルター"
          value={filters.findings || ""}
          onChange={(e) =>
            setFilters({ ...filters, findings: e.target.value })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 結果サマリ */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          結果サマリ
        </label>
        <input
          type="text"
          placeholder="結果サマリでフィルター"
          value={filters.resultSummary || ""}
          onChange={(e) =>
            setFilters({ ...filters, resultSummary: e.target.value })
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

