"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER";
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUnlink: () => Promise<void>;
  canEdit: boolean;
}

const roleOptions = [
  { value: "ADMIN", label: "管理者" },
  { value: "EDITOR", label: "編集者" },
  { value: "VIEWER", label: "閲覧者" },
];

const roleLabels: Record<string, string> = {
  ADMIN: "管理者",
  EDITOR: "編集者",
  VIEWER: "閲覧者",
};

/**
 * ユーザー詳細モーダルコンポーネント
 */
export default function UserDetailModal({
  isOpen,
  onClose,
  userId,
  onUnlink,
  canEdit,
}: UserDetailModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 編集用の一時的な状態
  const [editData, setEditData] = useState<Partial<User> | null>(null);

  // ユーザーデータを取得
  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
    }
  }, [isOpen, userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("ユーザーの取得に失敗しました");
      }
      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ユーザーの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 編集モード開始時に編集用データを初期化
  const handleStartEdit = () => {
    if (!user) return;
    setEditData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setIsEditing(true);
  };

  // 編集用データを更新（保存はしない）
  const handleEditFieldChange = (field: string, value: any) => {
    if (!editData) return;
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  // 一括保存
  const handleSaveAll = async () => {
    if (!user || !editData || !canEdit) return;

    setIsSaving(true);
    try {
      const updatePayload: any = {};
      if (editData.name !== undefined) updatePayload.name = editData.name;
      if (editData.email !== undefined) updatePayload.email = editData.email;
      if (editData.phone !== undefined) updatePayload.phone = editData.phone;
      if (editData.role !== undefined) updatePayload.role = editData.role;

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      const updated = await response.json();
      setUser(updated);
      setEditData(null);
      setIsEditing(false);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  // キャンセル
  const handleCancelEdit = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const handleUnlink = async () => {
    if (!confirm("このユーザーを関連から外しますか？")) return;

    setIsUnlinking(true);
    try {
      await onUnlink();
      onClose();
    } catch (error) {
      console.error("関連外しエラー:", error);
      alert("関連から外すのに失敗しました");
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleClose = () => {
    handleCancelEdit();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* モーダル */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                ユーザー詳細
              </h2>
              {user && (
                <p className="mt-1 text-sm text-gray-500">
                  {user.name || user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user && canEdit && !isEditing && (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    編集
                  </button>
                  <button
                    onClick={handleUnlink}
                    disabled={isUnlinking}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                  >
                    関連から外す
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">ユーザーを読み込み中...</p>
              </div>
            ) : !user ? (
              <div className="text-center py-8">
                <p className="text-gray-500">ユーザーが見つかりません</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InlineEditField
                      label="氏名"
                      value={isEditing && editData ? (editData.name || "") : (user.name || "")}
                      onSave={(value) => handleEditFieldChange("name", value || null)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="メール"
                      value={isEditing && editData ? (editData.email || "") : user.email}
                      onSave={(value) => handleEditFieldChange("email", value)}
                      type="email"
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="電話番号"
                      value={isEditing && editData ? (editData.phone || "") : (user.phone || "")}
                      onSave={(value) => handleEditFieldChange("phone", value || null)}
                      type="tel"
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditSelect
                      label="権限"
                      value={isEditing && editData ? (editData.role || user.role) : user.role}
                      onSave={(value) => handleEditFieldChange("role", value)}
                      options={roleOptions}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 保存・キャンセルボタン（編集モード時のみ表示） */}
          {isEditing && user && (
            <div className="border-t border-gray-200 bg-white px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

