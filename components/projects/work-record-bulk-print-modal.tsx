"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface WorkRecord {
  id: string;
  inspectionDate: Date;
  workType: string;
  equipment: {
    id: string;
    name: string;
    model: string | null;
  };
}

interface WorkRecordBulkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  workRecords: WorkRecord[];
}

const workTypeLabels: Record<string, string> = {
  INSPECTION: "点検",
  REPAIR: "修理",
  MAINTENANCE: "メンテナンス",
  OTHER: "その他",
};

export default function WorkRecordBulkPrintModal({
  isOpen,
  onClose,
  projectId,
  workRecords,
}: WorkRecordBulkPrintModalProps) {
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いたときに全て選択
      setSelectedRecordIds(new Set(workRecords.map((r) => r.id)));
      setIsSelectingTemplate(false);
    }
  }, [isOpen, workRecords]);

  const handleToggleRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecordIds);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecordIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRecordIds.size === workRecords.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(workRecords.map((r) => r.id)));
    }
  };

  const handleProceedToTemplate = () => {
    if (selectedRecordIds.size === 0) {
      alert("印刷する作業記録を選択してください");
      return;
    }
    setIsSelectingTemplate(true);
  };

  const handleBack = () => {
    setIsSelectingTemplate(false);
  };

  if (!isOpen) return null;

  if (isSelectingTemplate) {
    return (
      <WorkRecordBulkPrintTemplateSelector
        isOpen={isOpen}
        onClose={onClose}
        workRecordIds={Array.from(selectedRecordIds)}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* モーダル */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">作業記録一括印刷</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  印刷する作業記録を選択してください（{selectedRecordIds.size}/{workRecords.length}件選択中）
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedRecordIds.size === workRecords.length ? "全て解除" : "全て選択"}
                </button>
              </div>
            </div>

            {workRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">作業記録がありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workRecords.map((record) => {
                  const inspectionDate = new Date(record.inspectionDate);
                  const formattedDate = inspectionDate.toLocaleDateString("ja-JP");
                  const isSelected = selectedRecordIds.has(record.id);

                  return (
                    <label
                      key={record.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRecord(record.id)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {workTypeLabels[record.workType] || record.workType}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formattedDate}
                          </span>
                          <span className="text-sm text-gray-500">
                            {record.equipment.name}
                            {record.equipment.model && ` (${record.equipment.model})`}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleProceedToTemplate}
              disabled={selectedRecordIds.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              一括印刷へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// テンプレート選択コンポーネント
interface WorkRecordBulkPrintTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  workRecordIds: string[];
  onBack: () => void;
}

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

function WorkRecordBulkPrintTemplateSelector({
  isOpen,
  onClose,
  workRecordIds,
  onBack,
}: WorkRecordBulkPrintTemplateSelectorProps) {
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
      const response = await fetch("/api/document-templates?templateType=REPORT");
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

  const handleBulkPrint = async () => {
    if (!selectedTemplateId) {
      setError("テンプレートを選択してください");
      return;
    }

    if (workRecordIds.length === 0) {
      setError("作業記録が選択されていません");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/work-records/bulk-generate-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workRecordIds,
          templateId: selectedTemplateId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "一括印刷に失敗しました");
      }

      // 生成されたZIPファイルをダウンロード
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Content-Dispositionヘッダーからファイル名を取得
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = "作業記録一括印刷.zip";
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

      onClose();
    } catch (err) {
      console.error("一括印刷エラー:", err);
      setError(err instanceof Error ? err.message : "一括印刷に失敗しました");
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
            <h2 className="text-xl font-semibold text-gray-900">テンプレートを選択</h2>
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
                  <p className="text-lg font-medium text-gray-900">作業記録を一括印刷中...</p>
                  <p className="mt-2 text-sm text-gray-500">
                    {workRecordIds.length}件の作業記録を処理しています
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
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onBack}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              戻る
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkPrint}
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
                  "一括印刷"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

