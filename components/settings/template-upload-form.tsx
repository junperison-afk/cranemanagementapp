"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface TemplateType {
  value: "QUOTE" | "CONTRACT" | "REPORT";
  label: string;
}

const templateTypes: TemplateType[] = [
  { value: "QUOTE", label: "見積書" },
  { value: "CONTRACT", label: "契約書" },
  { value: "REPORT", label: "報告書" },
];

export default function TemplateUploadForm() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [templateType, setTemplateType] = useState<"QUOTE" | "CONTRACT" | "REPORT">("QUOTE");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 編集者以上の権限チェック
  if (!session || session.user.role === "VIEWER") {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // ファイルサイズチェック（5MB）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        setError("ファイルサイズが大きすぎます（最大5MB）");
        setFile(null);
        return;
      }

      // ファイルタイプチェック
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("サポートされていないファイル形式です（.docxまたは.xlsxのみ）");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);

      // ファイル名から自動的にテンプレート名を設定
      if (!name && selectedFile.name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateType", templateType);
      formData.append("name", name);
      if (description) {
        formData.append("description", description);
      }
      formData.append("isDefault", isDefault ? "true" : "false");

      const response = await fetch("/api/document-templates", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`テンプレート「${result.template.name}」のアップロードに成功しました`);
        // フォームをリセット
        setFile(null);
        setName("");
        setDescription("");
        setIsDefault(false);
        // ファイル入力もリセット
        const fileInput = document.getElementById("file") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        // 成功メッセージを5秒後に消す
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        setError(result.error || "テンプレートのアップロードに失敗しました");
      }
    } catch (err) {
      console.error("アップロードエラー:", err);
      setError("エラーが発生しました: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "";

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        テンプレートアップロード
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* エラーメッセージ */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* ファイル選択 */}
        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            ファイル <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept=".docx,.xlsx"
            onChange={handleFileChange}
            required
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:text-gray-900 file:font-medium"
          />
          {file && (
            <div className="mt-2 text-sm text-gray-900">
              <p>選択されたファイル: {file.name}</p>
              <p>ファイルサイズ: {fileSizeMB} MB</p>
              <p>ファイルタイプ: {file.type || "不明"}</p>
            </div>
          )}
        </div>

        {/* テンプレートタイプ */}
        <div>
          <label
            htmlFor="templateType"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            テンプレートタイプ <span className="text-red-500">*</span>
          </label>
          <select
            id="templateType"
            name="templateType"
            value={templateType}
            onChange={(e) =>
              setTemplateType(e.target.value as "QUOTE" | "CONTRACT" | "REPORT")
            }
            required
            className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {templateTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* テンプレート名 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            テンプレート名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 見積書テンプレート_標準版"
            required
            className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm text-gray-900 placeholder:text-gray-400 bg-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* 説明 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            説明（任意）
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="テンプレートの説明を入力してください"
            rows={3}
            className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm text-gray-900 placeholder:text-gray-400 bg-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* デフォルトテンプレート */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isDefault"
            className="text-sm font-medium text-gray-900"
          >
            デフォルトテンプレートとして設定
          </label>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          文書を作成する際、最初にこのフォーマットが選択されます。
        </p>

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowUpIcon className="h-5 w-5" />
            {isUploading ? "アップロード中..." : "アップロード"}
          </button>
        </div>
      </form>
    </div>
  );
}

