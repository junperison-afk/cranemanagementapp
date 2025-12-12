"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";

interface Company {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  industryType: string | null;
  billingFlag: boolean;
  notes: string | null;
  updatedAt: Date;
}

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onUnlink: () => Promise<void>;
  canEdit: boolean;
}

/**
 * 取引先詳細モーダルコンポーネント
 */
export default function CompanyDetailModal({
  isOpen,
  onClose,
  companyId,
  onUnlink,
  canEdit,
}: CompanyDetailModalProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 編集用の一時的な状態
  const [editData, setEditData] = useState<Partial<Company> | null>(null);

  // 取引先データを取得
  useEffect(() => {
    if (isOpen && companyId) {
      fetchCompany();
    }
  }, [isOpen, companyId]);

  const fetchCompany = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) {
        throw new Error("取引先の取得に失敗しました");
      }
      const data = await response.json();
      setCompany(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "取引先の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 編集モード開始時に編集用データを初期化
  const handleStartEdit = () => {
    if (!company) return;
    setEditData({
      name: company.name,
      postalCode: company.postalCode,
      address: company.address,
      phone: company.phone,
      email: company.email,
      industryType: company.industryType,
      billingFlag: company.billingFlag,
      notes: company.notes,
    });
    setIsEditing(true);
  };

  // 編集用データを更新（保存はしない）
  const handleEditFieldChange = async (field: string, value: any): Promise<void> => {
    if (!editData) return;
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  // 一括保存
  const handleSaveAll = async () => {
    if (!company || !editData || !canEdit) return;

    setIsSaving(true);
    try {
      const updatePayload: any = {};
      if (editData.name !== undefined) updatePayload.name = editData.name;
      if (editData.postalCode !== undefined) updatePayload.postalCode = editData.postalCode;
      if (editData.address !== undefined) updatePayload.address = editData.address;
      if (editData.phone !== undefined) updatePayload.phone = editData.phone;
      if (editData.email !== undefined) updatePayload.email = editData.email;
      if (editData.industryType !== undefined) updatePayload.industryType = editData.industryType;
      if (editData.billingFlag !== undefined) updatePayload.billingFlag = editData.billingFlag;
      if (editData.notes !== undefined) updatePayload.notes = editData.notes;

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      const updated = await response.json();
      setCompany(updated);
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
    if (!confirm("この取引先を関連から外しますか？")) return;

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
                取引先詳細
              </h2>
              {company && (
                <p className="mt-1 text-sm text-gray-500">
                  {company.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {company && canEdit && !isEditing && (
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
                <p className="text-gray-500">取引先を読み込み中...</p>
              </div>
            ) : !company ? (
              <div className="text-center py-8">
                <p className="text-gray-500">取引先が見つかりません</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InlineEditField
                      label="会社名"
                      value={isEditing && editData ? (editData.name || "") : company.name}
                      onSave={(value) => handleEditFieldChange("name", value)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="郵便番号"
                      value={isEditing && editData ? (editData.postalCode || "") : (company.postalCode || "")}
                      onSave={(value) => handleEditFieldChange("postalCode", value || null)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <div className="md:col-span-2">
                      <InlineEditField
                        label="住所"
                        value={isEditing && editData ? (editData.address || "") : (company.address || "")}
                        onSave={(value) => handleEditFieldChange("address", value || null)}
                        multiline
                        className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                      />
                    </div>
                    <InlineEditField
                      label="電話番号"
                      value={isEditing && editData ? (editData.phone || "") : (company.phone || "")}
                      onSave={(value) => handleEditFieldChange("phone", value || null)}
                      type="tel"
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="メールアドレス"
                      value={isEditing && editData ? (editData.email || "") : (company.email || "")}
                      onSave={(value) => handleEditFieldChange("email", value || null)}
                      type="email"
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="業種"
                      value={isEditing && editData ? (editData.industryType || "") : (company.industryType || "")}
                      onSave={(value) => handleEditFieldChange("industryType", value || null)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditSelect
                      label="請求フラグ"
                      value={isEditing && editData ? (editData.billingFlag ? "true" : "false") : (company.billingFlag ? "true" : "false")}
                      onSave={(value) => handleEditFieldChange("billingFlag", value === "true")}
                      options={[
                        { value: "true", label: "有効" },
                        { value: "false", label: "無効" },
                      ]}
                      booleanMode={true}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <div className="md:col-span-2">
                      <InlineEditField
                        label="備考"
                        value={isEditing && editData ? (editData.notes || "") : (company.notes || "")}
                        onSave={(value) => handleEditFieldChange("notes", value || null)}
                        multiline
                        className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 保存・キャンセルボタン（編集モード時のみ表示） */}
          {isEditing && company && (
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

