"use client";

import { useState, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/use-debounce";
import { useTableSelection } from "@/hooks/use-table-selection";

interface Project {
  id: string;
  title: string;
  status: string;
  company: {
    id: string;
    name: string;
  };
  salesOpportunity?: {
    id: string;
    title: string;
  } | null;
}

interface ProjectSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (projectId: string) => Promise<void>;
  companyId: string;
  currentSalesOpportunityId: string;
}

/**
 * プロジェクト選択モーダルコンポーネント
 * 指定された会社で登録されているプロジェクトの一覧から選択できます
 */
export default function ProjectSelectModal({
  isOpen,
  onClose,
  onSelect,
  companyId,
  currentSalesOpportunityId,
}: ProjectSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // 検索クエリのデバウンス（500ms）
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // プロジェクト検索
  const searchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        companyId: companyId,
      });

      if (debouncedSearchQuery) {
        params.set("search", debouncedSearchQuery);
      }

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // 既に他の営業案件に紐付いているプロジェクトを除外
        // ただし、現在の営業案件に紐付いているプロジェクトは表示（関連付けを解除できるように）
        const availableProjects = (data.projects || []).filter(
          (project: Project) =>
            !project.salesOpportunity ||
            project.salesOpportunity.id === currentSalesOpportunityId
        );
        setProjects(availableProjects);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("プロジェクト検索エラー:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, page, limit, companyId, currentSalesOpportunityId]);

  // 検索クエリまたはページが変更されたら検索
  useEffect(() => {
    if (isOpen) {
      searchProjects();
    }
  }, [isOpen, debouncedSearchQuery, page, searchProjects]);

  // モーダルを開いたときに検索クエリと選択状態をリセット
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setPage(1);
      setSelectedProjectId(null);
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

  // 決定ボタンを押したときの処理
  const handleConfirm = async () => {
    if (!selectedProjectId) return;

    setIsLinking(true);
    try {
      await onSelect(selectedProjectId);
      onClose();
    } catch (error) {
      console.error("プロジェクト関連付けエラー:", error);
      alert("プロジェクトの関連付けに失敗しました");
    } finally {
      setIsLinking(false);
    }
  };

  const statusLabels: Record<string, string> = {
    PLANNING: "計画中",
    IN_PROGRESS: "進行中",
    ON_HOLD: "保留",
    COMPLETED: "完了",
  };

  const statusColors: Record<string, string> = {
    PLANNING: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    ON_HOLD: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
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
              既存プロジェクトを選択
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={!selectedProjectId || isLinking}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLinking ? "関連付け中..." : "決定"}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <span className="sr-only">閉じる</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* 検索フィールド */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="プロジェクトタイトル、備考、取引先名で検索..."
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
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">検索中...</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">
                  {searchQuery
                    ? "検索結果が見つかりませんでした"
                    : "この会社に登録されているプロジェクトがありません"}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {total}件のプロジェクトが見つかりました
                </div>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          プロジェクトタイトル
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          取引先
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          関連営業案件
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr
                          key={project.id}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedProjectId === project.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => setSelectedProjectId(project.id)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="radio"
                              name="project"
                              checked={selectedProjectId === project.id}
                              onChange={() => setSelectedProjectId(project.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {project.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                statusColors[project.status] ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {statusLabels[project.status] || project.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {project.company.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {project.salesOpportunity ? (
                              <div className="text-sm text-gray-900">
                                {project.salesOpportunity.title}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

