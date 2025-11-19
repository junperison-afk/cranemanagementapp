"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { navigateWithLoading } from "@/lib/navigation-helper";

interface FilterInfo {
  label: string;
  value: string;
}

interface PaginationHeaderProps {
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  basePath: string; // 例: "/sales-opportunities", "/companies" など
  filterLabels?: Record<string, string>; // フィルター項目のラベルマッピング
  filterValueFormatters?: Record<string, (value: string) => string>; // フィルター値のフォーマッター
}

export default function PaginationHeader({
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
  basePath,
  filterLabels = {},
  filterValueFormatters = {},
}: PaginationHeaderProps) {
  // 取引先名のキャッシュ（companyId -> 取引先名）
  const [companyNameCache, setCompanyNameCache] = useState<Record<string, string>>({});
  const [loadingCompanyNames, setLoadingCompanyNames] = useState<Set<string>>(new Set());

  // 機器名のキャッシュ（equipmentId -> 機器名）
  const [equipmentNameCache, setEquipmentNameCache] = useState<Record<string, string>>({});
  const [loadingEquipmentNames, setLoadingEquipmentNames] = useState<Set<string>>(new Set());

  // ユーザー名のキャッシュ（userId -> ユーザー名）
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({});
  const [loadingUserNames, setLoadingUserNames] = useState<Set<string>>(new Set());

  // companyIdがある場合、取引先名を取得
  useEffect(() => {
    const companyId = searchParams.companyId;
    
    // companyIdがなく、キャッシュにもない場合は何もしない
    if (!companyId || companyNameCache[companyId] || loadingCompanyNames.has(companyId)) {
      return;
    }

    // ローディング状態を設定
    setLoadingCompanyNames((prev) => {
      const next = new Set(prev);
      next.add(companyId);
      return next;
    });

    // 取引先名を取得
    fetch(`/api/companies/${companyId}`)
      .then((res) => res.json())
      .then((data) => {
        const name = data?.name || companyId;
        setCompanyNameCache((prev) => ({ ...prev, [companyId]: name }));
      })
      .catch(() => {
        // エラー時はIDをそのまま使用
        setCompanyNameCache((prev) => ({ ...prev, [companyId]: companyId }));
      })
      .finally(() => {
        setLoadingCompanyNames((prev) => {
          const next = new Set(prev);
          next.delete(companyId);
          return next;
        });
      });
  }, [searchParams.companyId]);

  // equipmentIdがある場合、機器名を取得
  useEffect(() => {
    const equipmentId = searchParams.equipmentId;
    
    if (!equipmentId || equipmentNameCache[equipmentId] || loadingEquipmentNames.has(equipmentId)) {
      return;
    }

    setLoadingEquipmentNames((prev) => {
      const next = new Set(prev);
      next.add(equipmentId);
      return next;
    });

    fetch(`/api/equipment/${equipmentId}`)
      .then((res) => res.json())
      .then((data) => {
        const name = data?.name || equipmentId;
        setEquipmentNameCache((prev) => ({ ...prev, [equipmentId]: name }));
      })
      .catch(() => {
        setEquipmentNameCache((prev) => ({ ...prev, [equipmentId]: equipmentId }));
      })
      .finally(() => {
        setLoadingEquipmentNames((prev) => {
          const next = new Set(prev);
          next.delete(equipmentId);
          return next;
        });
      });
  }, [searchParams.equipmentId]);

  // userIdまたはassignedUserIdがある場合、ユーザー名を取得
  useEffect(() => {
    const userId = searchParams.userId || searchParams.assignedUserId;
    
    if (!userId || userNameCache[userId] || loadingUserNames.has(userId)) {
      return;
    }

    setLoadingUserNames((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const name = data?.name || data?.email || userId;
        setUserNameCache((prev) => ({ ...prev, [userId]: name }));
      })
      .catch(() => {
        setUserNameCache((prev) => ({ ...prev, [userId]: userId }));
      })
      .finally(() => {
        setLoadingUserNames((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
  }, [searchParams.userId, searchParams.assignedUserId]);

  // フィルター情報を取得（search, page, limit, filterを除く）
  const getFilterInfo = (): FilterInfo[] => {
    const filters: FilterInfo[] = [];
    
    // 全体検索
    if (searchParams.search) {
      filters.push({ label: "全体検索", value: searchParams.search });
    }
    
    // その他のフィルター項目
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && !["page", "limit", "filter", "search"].includes(key)) {
        const label = filterLabels[key] || key;
        let formattedValue = value;
        
        // IDフィールドの場合は名前を取得
        if (key === "companyId") {
          formattedValue = companyNameCache[value] || value;
        } else if (key === "equipmentId") {
          formattedValue = equipmentNameCache[value] || value;
        } else if (key === "userId" || key === "assignedUserId") {
          formattedValue = userNameCache[value] || value;
        } else {
          // その他のフォーマッターを適用
          const formatter = filterValueFormatters[key];
          if (formatter) {
            formattedValue = formatter(value);
          }
        }
        
        filters.push({ label, value: formattedValue });
      }
    });
    
    return filters;
  };

  const activeFilters = getFilterInfo();

  return (
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">データ数の合計 {total}</div>
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded"
              >
                フィルター {filter.label} {filter.value}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <select
          value={limit}
          onChange={(e) => {
            const params = new URLSearchParams();
            // 既存の検索パラメータを保持（limitとpage以外）
            Object.entries(searchParams).forEach(([key, value]) => {
              if (value && key !== "limit" && key !== "page") {
                params.set(key, value);
              }
            });
            // 新しいlimitを設定
            params.set("limit", e.target.value);
            // ページを1にリセット
            params.set("page", "1");
            // URLを更新（ローディングバー付き）
            navigateWithLoading(`${basePath}?${params.toString()}`);
          }}
          className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">10 件/ページ</option>
          <option value="20">20 件/ページ</option>
          <option value="50">50 件/ページ</option>
          <option value="100">100 件/ページ</option>
        </select>
        <div className="text-sm text-gray-700">
          {totalPages > 0 ? `${page} - ${totalPages}` : "0 - 0"}
        </div>
        <div className="flex gap-1">
          <Link
            href={`${basePath}?${new URLSearchParams({
              ...searchParams,
              page: String(Math.max(1, page - 1)),
            }).toString()}`}
            className={`p-1 rounded-md ${
              page > 1
                ? "text-gray-700 hover:bg-gray-200"
                : "text-gray-300 cursor-not-allowed"
            }`}
            onClick={(e) => {
              if (page <= 1) e.preventDefault();
            }}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <Link
            href={`${basePath}?${new URLSearchParams({
              ...searchParams,
              page: String(Math.min(totalPages, page + 1)),
            }).toString()}`}
            className={`p-1 rounded-md ${
              page < totalPages
                ? "text-gray-700 hover:bg-gray-200"
                : "text-gray-300 cursor-not-allowed"
            }`}
            onClick={(e) => {
              if (page >= totalPages) e.preventDefault();
            }}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

