"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { startLoadingBar } from "@/lib/navigation-helper";
import LookupField from "@/components/common/lookup-field";

interface InlineEditLookupProps {
  label: string;
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  apiEndpoint: string;
  displayKey?: string;
  secondaryKey?: string;
  itemsKey?: string;
  placeholder?: string;
  filterParams?: Record<string, string>;
  className?: string;
  createNewUrl?: string; // 新規作成画面へのURL（例: "/companies/new" または "/sales-opportunities/new?companyId=xxx"）
  returnUrl?: string; // 新規作成後に戻るURL（例: "/projects/123"）
  canEdit?: boolean; // 編集可能かどうか
  createFormComponent?: React.ComponentType<{
    onSuccess: (id: string) => void;
    onCancel: () => void;
  }>; // 新規作成フォームコンポーネント
}

/**
 * インライン編集可能なルックアップフィールドコンポーネント
 * 詳細画面でルックアップ項目を編集する際に使用
 */
export default function InlineEditLookup({
  label,
  value,
  onSave,
  apiEndpoint,
  displayKey = "name",
  secondaryKey,
  itemsKey,
  placeholder,
  filterParams = {},
  className = "",
  createNewUrl,
  returnUrl,
  canEdit = true,
  createFormComponent,
}: InlineEditLookupProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(value || "");
  const [displayText, setDisplayText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 値が変更されたときに表示テキストを更新
  useEffect(() => {
    const fetchDisplayText = async () => {
      if (!value) {
        setDisplayText("");
        return;
      }

      try {
        const response = await fetch(`${apiEndpoint}?limit=1000`);
        if (response.ok) {
          const data = await response.json();
          let items: any[] = [];
          if (itemsKey) {
            items = data[itemsKey] || [];
          } else {
            items = data.companies || data.projects || data.salesOpportunities || data.users || data.equipment || data.contacts || [];
          }
          const found = items.find((item: any) => item.id === value);
          if (found) {
            setDisplayText(found[displayKey] || "");
          } else {
            setDisplayText("");
          }
        }
      } catch (error) {
        console.error("表示テキスト取得エラー:", error);
        setDisplayText("");
      }
    };

    fetchDisplayText();
  }, [value, apiEndpoint, displayKey, itemsKey]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editValue || null);
      setIsEditing(false);
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleCreateSuccess = (idOrData: string | any) => {
    setIsCreateModalOpen(false);
    // idまたはidを含むデータを受け取る（後方互換性のため）
    const id = typeof idOrData === "string" ? idOrData : idOrData?.id;
    if (!id) return;
    
    // ローディングバーを開始
    startLoadingBar();
    
    // returnUrlがあればそこに戻る、なければ作成したレコードの詳細画面に遷移
    if (returnUrl) {
      router.push(returnUrl);
      router.refresh();
    } else {
      // createNewUrlからリソースパスを取得（例: "/companies/new" -> "companies"）
      const resourcePath = createNewUrl?.split("/")[1] || "";
      if (resourcePath) {
        router.push(`/${resourcePath}/${id}`);
      }
    }
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (createFormComponent) {
      setIsCreateModalOpen(true);
    } else if (createNewUrl) {
      // ローディングバーを開始
      startLoadingBar();
      // フォームコンポーネントが指定されていない場合はページ遷移
      const url = createNewUrl + (createNewUrl.includes("?") ? "&" : "?") + (returnUrl ? `returnUrl=${encodeURIComponent(returnUrl)}` : "");
      router.push(url);
    }
  };

  if (isEditing) {
    return (
      <div className={`group ${className}`}>
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <LookupField
              label=""
              value={editValue}
              onChange={(newValue) => setEditValue(newValue)}
              apiEndpoint={apiEndpoint}
              displayKey={displayKey}
              secondaryKey={secondaryKey}
              itemsKey={itemsKey}
              placeholder={placeholder}
              filterParams={filterParams}
              className="[&>label]:hidden"
            />
          </div>
          <div className="flex gap-2 items-center pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
              title="保存"
            >
              <CheckIcon className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 flex items-center justify-center transition-colors"
              title="キャンセル"
              onKeyDown={handleKeyDown}
            >
              <XMarkIcon className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-500">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {createNewUrl && canEdit && (
            <button
              type="button"
              onClick={handleCreateClick}
              className="text-sm text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
              title="新規作成"
            >
              + 追加
            </button>
          )}
          {canEdit && (
            <PencilIcon 
              className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
              onClick={() => setIsEditing(true)}
            />
          )}
        </div>
      </div>
      <div 
        className={`mt-1 px-3 py-2 rounded-md border border-transparent group-hover:border-gray-300 group-hover:bg-gray-50 transition-all min-h-[2.5rem] flex items-center ${canEdit ? 'cursor-pointer' : ''}`}
        onClick={() => canEdit && setIsEditing(true)}
      >
        <p className="text-sm text-gray-900">
          {displayText || <span className="text-gray-400 italic">未設定</span>}
        </p>
      </div>
      
      {/* 新規作成モーダル */}
      {isCreateModalOpen && createFormComponent && (
        <CreateModal
          title={`${label}を新規作成`}
          onClose={handleCreateCancel}
        >
          {React.createElement(createFormComponent, {
            onSuccess: handleCreateSuccess,
            onCancel: handleCreateCancel,
          })}
        </CreateModal>
      )}
    </div>
  );
}

/**
 * モーダルコンポーネント
 */
interface CreateModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function CreateModal({ title, children, onClose }: CreateModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span className="sr-only">閉じる</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

