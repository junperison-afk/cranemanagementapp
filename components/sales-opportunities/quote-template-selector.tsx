"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Template {
  id: string;
  userId: string | null;
  templateType: string;
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

interface QuoteTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  salesOpportunityId: string;
  quoteId?: string; // 見積ID（オプショナル、指定されると見積データを使用）
  onSuccess?: () => void;
}

export default function QuoteTemplateSelector({
  isOpen,
  onClose,
  salesOpportunityId,
  quoteId,
  onSuccess,
}: QuoteTemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // テンプレート一覧を取得
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/document-templates?templateType=QUOTE");
      if (!response.ok) {
        throw new Error("テンプレートの取得に失敗しました");
      }
      const data = await response.json();
      setTemplates(data.templates || []);
      if (data.templates && data.templates.length > 0) {
        // デフォルトテンプレートまたは最初のテンプレートを選択
        const defaultTemplate = data.templates.find((t: Template) => t.isDefault);
        setSelectedTemplateId(defaultTemplate?.id || data.templates[0].id);
      }
    } catch (err) {
      console.error("テンプレート取得エラー:", err);
      setError(err instanceof Error ? err.message : "テンプレートの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      setError("テンプレートを選択してください");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sales-opportunities/${salesOpportunityId}/generate-quote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: selectedTemplateId,
            quoteId: quoteId || undefined, // 見積IDを送信（指定されている場合）
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "見積書の生成に失敗しました");
      }

      // 生成されたWordファイルをダウンロード
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Content-Dispositionヘッダーからファイル名を取得
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = "見積書.docx";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ""));
        }
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 成功時のコールバック
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("見積書生成エラー:", err);
      setError(err instanceof Error ? err.message : "見積書の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* モーダル */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">見積書作成</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            {/* 生成中のオーバーレイ */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <svg
                    className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-lg font-medium text-gray-900">見積書を生成中...</p>
                  <p className="mt-2 text-sm text-gray-500">
                    しばらくお待ちください
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">テンプレートを読み込み中...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  使用可能なテンプレートがありません。
                  <br />
                  テンプレートをアップロードしてください。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テンプレートを選択
                  </label>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <label
                        key={template.id}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedTemplateId === template.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="template"
                          value={template.id}
                          checked={selectedTemplateId === template.id}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {template.name}
                            </span>
                            {template.isDefault && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                デフォルト
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {template.description}
                            </p>
                          )}
                          <div className="mt-2 text-xs text-gray-400">
                            {template.user
                              ? `作成者: ${template.user.name || template.user.email}`
                              : "システムデフォルト"}
                            {" ・ "}
                            {Math.round(template.fileSize / 1024)}KB
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedTemplateId || templates.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  生成中...
                </>
              ) : (
                "見積書を生成"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
