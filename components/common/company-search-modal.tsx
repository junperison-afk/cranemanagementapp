"use client";

import { useState, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/use-debounce";

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface CompanySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (company: Company) => void;
}

/**
 * 取引先検索モーダルコンポーネント
 * 検索して取引先を選択できます
 */
export default function CompanySearchModal({
  isOpen,
  onClose,
  onSelect,
}: CompanySearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // 検索クエリのデバウンス（500ms）
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 取引先検索
  const searchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (debouncedSearchQuery) {
        params.set("search", debouncedSearchQuery);
      }

      const response = await fetch(`/api/companies?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("取引先検索エラー:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, page, limit]);

  // 検索クエリまたはページが変更されたら検索
  useEffect(() => {
    if (isOpen) {
      searchCompanies();
    }
  }, [isOpen, debouncedSearchQuery, page, searchCompanies]);

  // モーダルを開いたときに検索クエリをリセット
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setPage(1);
    }
  }, [isOpen]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSelect = (company: Company) => {
    onSelect(company);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              取引先を検索
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span className="sr-only">閉じる</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 検索フィールド */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="取引先名、住所、メールアドレスで検索..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // 検索時にページをリセット
                }}
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* 検索結果 */}
          <div className="max-h-96 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">検索中...</div>
              </div>
            ) : companies.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">
                  {searchQuery
                    ? "検索結果が見つかりませんでした"
                    : "検索キーワードを入力してください"}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {total}件の取引先が見つかりました
                </div>
                <div className="space-y-2">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelect(company)}
                      className="w-full text-left rounded-md border border-gray-200 p-4 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {company.name}
                      </div>
                      {company.address && (
                        <div className="mt-1 text-sm text-gray-500">
                          {company.address}
                        </div>
                      )}
                      {(company.phone || company.email) && (
                        <div className="mt-1 text-sm text-gray-500">
                          {company.phone && <span>{company.phone}</span>}
                          {company.phone && company.email && (
                            <span className="mx-2">•</span>
                          )}
                          {company.email && <span>{company.email}</span>}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* ページネーション */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    <div className="text-sm text-gray-700">
                      {page} / {totalPages} ページ
                    </div>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

