"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface PaginationHeaderProps {
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  basePath: string; // 例: "/sales-opportunities", "/companies" など
}

export default function PaginationHeader({
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
  basePath,
}: PaginationHeaderProps) {
  return (
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
      <div className="text-sm text-gray-700">データ数の合計 {total}</div>
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
            // URLを更新
            window.location.href = `${basePath}?${params.toString()}`;
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

