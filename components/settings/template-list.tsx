"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface Template {
  id: string;
  userId: string | null;
  templateType: "QUOTE" | "CONTRACT" | "REPORT";
  name: string;
  description: string | null;
  fileSize: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

const templateTypeLabels: Record<string, string> = {
  QUOTE: "見積書",
  CONTRACT: "契約書",
  REPORT: "報告書",
};

export default function TemplateList() {
  const { data: session, status: sessionStatus } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false); // 初回読み込み完了フラグ（refで管理）
  const [error, setError] = useState<string | null>(null);
  const [templateTypeFilter, setTemplateTypeFilter] = useState<
    "QUOTE" | "CONTRACT" | "REPORT" | "ALL"
  >("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const url =
        templateTypeFilter === "ALL"
          ? "/api/document-templates"
          : `/api/document-templates?templateType=${templateTypeFilter}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("テンプレート一覧の取得に失敗しました");
      }
      const data = await response.json();
      setTemplates(data.templates || []);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error("テンプレート取得エラー:", err);
      setError(
        err instanceof Error ? err.message : "テンプレート一覧の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // セッションの読み込みが完了してから実行
    if (sessionStatus === "loading") {
      return;
    }

    // 編集者以上の権限チェック
    if (!session || session.user.role === "VIEWER") {
      return;
    }

    // 初回読み込み時のみ読み込み中を表示、フィルター変更時は非表示
    const isFirstLoad = !hasLoadedRef.current;
    fetchTemplates(isFirstLoad);
  }, [templateTypeFilter, session, sessionStatus]);

  const handleDelete = async (templateId: string) => {
    if (!confirm("このテンプレートを削除してもよろしいですか？")) {
      return;
    }

    setDeletingId(templateId);
    try {
      const response = await fetch(`/api/document-templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 削除成功後、一覧を再取得（読み込み中は非表示）
        fetchTemplates(false);
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (err) {
      console.error("削除エラー:", err);
      alert("エラーが発生しました: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // セッション読み込み中は何も表示しない
  if (sessionStatus === "loading") {
    return null;
  }

  // 編集者以上の権限チェック
  if (!session || session.user.role === "VIEWER") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <p className="text-sm text-gray-500">テンプレートを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            テンプレート一覧
          </h2>
          <select
            value={templateTypeFilter}
            onChange={(e) =>
              setTemplateTypeFilter(
                e.target.value as "QUOTE" | "CONTRACT" | "REPORT" | "ALL"
              )
            }
            className="rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ALL">すべて</option>
            <option value="QUOTE">見積書</option>
            <option value="CONTRACT">契約書</option>
            <option value="REPORT">報告書</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-6">
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {templates.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            テンプレートがありません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ファイルサイズ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    デフォルト
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {template.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {templateTypeLabels[template.templateType]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {template.description || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(template.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.user?.name || template.user?.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isDefault ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          デフォルト
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={deletingId === template.id}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-4 w-4" />
                        {deletingId === template.id ? "削除中..." : "削除"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

