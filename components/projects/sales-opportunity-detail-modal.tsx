"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PencilIcon } from "@heroicons/react/24/outline";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";
import InlineEditLookup from "@/components/companies/inline-edit-lookup";
import CompanyCreateForm from "@/components/companies/company-create-form";

interface SalesOpportunity {
  id: string;
  title: string;
  status: "ESTIMATING" | "WON" | "LOST";
  estimatedAmount: number | null;
  craneCount: number | null;
  craneInfo: string | null;
  occurredAt: Date | null;
  notes: string | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
    postalCode: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
}

interface SalesOpportunityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOpportunityId: string;
  onUnlink: () => Promise<void>;
  canEdit: boolean;
}

const statusOptions = [
  { value: "ESTIMATING", label: "見積中" },
  { value: "WON", label: "受注" },
  { value: "LOST", label: "失注" },
];

const statusLabels: Record<string, string> = {
  ESTIMATING: "見積中",
  WON: "受注",
  LOST: "失注",
};

const statusColors: Record<string, string> = {
  ESTIMATING: "bg-yellow-100 text-yellow-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

/**
 * 営業案件詳細モーダルコンポーネント
 */
export default function SalesOpportunityDetailModal({
  isOpen,
  onClose,
  salesOpportunityId,
  onUnlink,
  canEdit,
}: SalesOpportunityDetailModalProps) {
  const [salesOpportunity, setSalesOpportunity] = useState<SalesOpportunity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 編集用の一時的な状態
  const [editData, setEditData] = useState<Partial<SalesOpportunity> | null>(null);

  // 営業案件データを取得
  useEffect(() => {
    if (isOpen && salesOpportunityId) {
      fetchSalesOpportunity();
    }
  }, [isOpen, salesOpportunityId]);

  const fetchSalesOpportunity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sales-opportunities/${salesOpportunityId}`);
      if (!response.ok) {
        throw new Error("営業案件の取得に失敗しました");
      }
      const data = await response.json();
      setSalesOpportunity(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "営業案件の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 編集モード開始時に編集用データを初期化
  const handleStartEdit = () => {
    if (!salesOpportunity) return;
    setEditData({
      title: salesOpportunity.title,
      companyId: salesOpportunity.company.id,
      status: salesOpportunity.status,
      estimatedAmount: salesOpportunity.estimatedAmount,
      craneCount: salesOpportunity.craneCount,
      craneInfo: salesOpportunity.craneInfo,
      occurredAt: salesOpportunity.occurredAt,
      notes: salesOpportunity.notes,
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
    if (!salesOpportunity || !editData || !canEdit) return;

    setIsSaving(true);
    try {
      const updatePayload: any = {};
      if (editData.title !== undefined) updatePayload.title = editData.title;
      if (editData.companyId !== undefined) updatePayload.companyId = editData.companyId;
      if (editData.status !== undefined) updatePayload.status = editData.status;
      if (editData.estimatedAmount !== undefined) updatePayload.estimatedAmount = editData.estimatedAmount;
      if (editData.craneCount !== undefined) updatePayload.craneCount = editData.craneCount;
      if (editData.craneInfo !== undefined) updatePayload.craneInfo = editData.craneInfo;
      if (editData.occurredAt !== undefined) updatePayload.occurredAt = editData.occurredAt;
      if (editData.notes !== undefined) updatePayload.notes = editData.notes;

      const response = await fetch(`/api/sales-opportunities/${salesOpportunity.id}`, {
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
      setSalesOpportunity(updated);
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
    if (!confirm("この営業案件を関連から外しますか？")) return;

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
                営業案件詳細
              </h2>
              {salesOpportunity && (
                <p className="mt-1 text-sm text-gray-500">
                  {salesOpportunity.title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {salesOpportunity && canEdit && !isEditing && (
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
                <p className="text-gray-500">営業案件を読み込み中...</p>
              </div>
            ) : !salesOpportunity ? (
              <div className="text-center py-8">
                <p className="text-gray-500">営業案件が見つかりません</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InlineEditField
                      label="案件タイトル"
                      value={isEditing && editData ? (editData.title || "") : salesOpportunity.title}
                      onSave={(value) => handleEditFieldChange("title", value)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditLookup
                      label="関連取引先"
                      value={isEditing && editData ? (editData.companyId || salesOpportunity.company.id) : salesOpportunity.company.id}
                      onSave={(value) => handleEditFieldChange("companyId", value)}
                      apiEndpoint="/api/companies"
                      displayKey="name"
                      secondaryKey="address"
                      itemsKey="companies"
                      placeholder="例: 株式会社○○工業"
                      createNewUrl="/companies/new"
                      returnUrl={`/projects/${salesOpportunity.id}`}
                      canEdit={canEdit && isEditing}
                      createFormComponent={CompanyCreateForm}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditSelect
                      label="ステータス"
                      value={isEditing && editData ? (editData.status || salesOpportunity.status) : salesOpportunity.status}
                      onSave={(value) => handleEditFieldChange("status", value)}
                      options={statusOptions}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="想定金額"
                      value={
                        isEditing && editData
                          ? (editData.estimatedAmount ? String(editData.estimatedAmount) : "")
                          : (salesOpportunity.estimatedAmount ? String(salesOpportunity.estimatedAmount) : "")
                      }
                      onSave={(value) =>
                        handleEditFieldChange("estimatedAmount", value ? value : null)
                      }
                      type="text"
                      placeholder="例: 1000000"
                      formatNumber={true}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="クレーン台数"
                      value={
                        isEditing && editData
                          ? (editData.craneCount ? String(editData.craneCount) : "")
                          : (salesOpportunity.craneCount ? String(salesOpportunity.craneCount) : "")
                      }
                      onSave={(value) =>
                        handleEditFieldChange("craneCount", value ? parseInt(value) : null)
                      }
                      type="text"
                      placeholder="例: 5"
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="発生日"
                      value={
                        isEditing && editData && editData.occurredAt
                          ? new Date(editData.occurredAt).toISOString().split("T")[0]
                          : (salesOpportunity.occurredAt
                              ? new Date(salesOpportunity.occurredAt).toISOString().split("T")[0]
                              : "")
                      }
                      onSave={(value) =>
                        handleEditFieldChange("occurredAt", value ? new Date(value).toISOString() : null)
                      }
                      type="date"
                      placeholder="日付を選択"
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <div className="md:col-span-2">
                      <InlineEditField
                        label="クレーン情報"
                        value={isEditing && editData ? (editData.craneInfo || "") : (salesOpportunity.craneInfo || "")}
                        onSave={(value) => handleEditFieldChange("craneInfo", value || null)}
                        multiline
                        placeholder="型式・概要など"
                        className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <InlineEditField
                        label="備考"
                        value={isEditing && editData ? (editData.notes || "") : (salesOpportunity.notes || "")}
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
          {isEditing && salesOpportunity && (
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

