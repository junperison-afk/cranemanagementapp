"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditLookup from "@/components/companies/inline-edit-lookup";
import CompanyCreateForm from "@/components/companies/company-create-form";
import ProjectCreateForm from "@/components/projects/project-create-form";

interface Equipment {
  id: string;
  name: string;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  specifications: string | null;
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
  project: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface EquipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  onUnlink: () => Promise<void>;
  canEdit: boolean;
}

/**
 * 機器詳細モーダルコンポーネント
 */
export default function EquipmentDetailModal({
  isOpen,
  onClose,
  equipmentId,
  onUnlink,
  canEdit,
}: EquipmentDetailModalProps) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 編集用の一時的な状態（会社・プロジェクトIDも保持）
  const [editData, setEditData] = useState<
    (Partial<Equipment> & { companyId?: string; projectId?: string | null }) | null
  >(null);

  // 機器データを取得
  useEffect(() => {
    if (isOpen && equipmentId) {
      fetchEquipment();
    }
  }, [isOpen, equipmentId]);

  const fetchEquipment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      if (!response.ok) {
        throw new Error("機器の取得に失敗しました");
      }
      const data = await response.json();
      setEquipment(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "機器の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 編集モード開始時に編集用データを初期化
  const handleStartEdit = () => {
    if (!equipment) return;
    setEditData({
      name: equipment.name,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      location: equipment.location,
      specifications: equipment.specifications,
      notes: equipment.notes,
      companyId: equipment.company.id,
      projectId: equipment.project?.id || null,
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
    if (!equipment || !editData || !canEdit) return;

    setIsSaving(true);
    try {
      const updatePayload: any = {};
      if (editData.name !== undefined) updatePayload.name = editData.name;
      if (editData.model !== undefined) updatePayload.model = editData.model;
      if (editData.serialNumber !== undefined) updatePayload.serialNumber = editData.serialNumber;
      if (editData.location !== undefined) updatePayload.location = editData.location;
      if (editData.specifications !== undefined) updatePayload.specifications = editData.specifications;
      if (editData.notes !== undefined) updatePayload.notes = editData.notes;
      if (editData.companyId !== undefined) updatePayload.companyId = editData.companyId;
      if (editData.projectId !== undefined) updatePayload.projectId = editData.projectId;

      const response = await fetch(`/api/equipment/${equipment.id}`, {
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
      setEquipment(updated);
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
    if (!confirm("この機器を関連から外しますか？")) return;

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
                機器詳細
              </h2>
              {equipment && (
                <p className="mt-1 text-sm text-gray-500">
                  {equipment.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {equipment && canEdit && !isEditing && (
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
                <p className="text-gray-500">機器を読み込み中...</p>
              </div>
            ) : !equipment ? (
              <div className="text-center py-8">
                <p className="text-gray-500">機器が見つかりません</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InlineEditField
                      label="機器名称"
                      value={isEditing && editData ? (editData.name || "") : equipment.name}
                      onSave={(value) => handleEditFieldChange("name", value)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="機種・型式"
                      value={isEditing && editData ? (editData.model || "") : (equipment.model || "")}
                      onSave={(value) => handleEditFieldChange("model", value || null)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="製造番号"
                      value={isEditing && editData ? (editData.serialNumber || "") : (equipment.serialNumber || "")}
                      onSave={(value) => handleEditFieldChange("serialNumber", value || null)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditField
                      label="設置場所"
                      value={isEditing && editData ? (editData.location || "") : (equipment.location || "")}
                      onSave={(value) => handleEditFieldChange("location", value || null)}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditLookup
                      label="関連取引先"
                      value={isEditing && editData ? (editData.companyId || equipment.company.id) : equipment.company.id}
                      onSave={(value) => handleEditFieldChange("companyId", value)}
                      apiEndpoint="/api/companies"
                      displayKey="name"
                      secondaryKey="address"
                      itemsKey="companies"
                      placeholder="例: 株式会社○○工業"
                      createNewUrl="/companies/new"
                      returnUrl={`/equipment/${equipment.id}`}
                      canEdit={canEdit && isEditing}
                      createFormComponent={CompanyCreateForm}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <InlineEditLookup
                      label="関連プロジェクト"
                      value={isEditing && editData ? (editData.projectId || "") : (equipment.project?.id || "")}
                      onSave={(value) => handleEditFieldChange("projectId", value || null)}
                      apiEndpoint="/api/projects"
                      displayKey="title"
                      secondaryKey="status"
                      itemsKey="projects"
                      placeholder="プロジェクトを選択"
                      createNewUrl="/projects/new"
                      returnUrl={`/equipment/${equipment.id}`}
                      canEdit={canEdit && isEditing}
                      createFormComponent={ProjectCreateForm}
                      className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                    />
                    <div className="md:col-span-2">
                      <InlineEditField
                        label="仕様情報"
                        value={isEditing && editData ? (editData.specifications || "") : (equipment.specifications || "")}
                        onSave={(value) => handleEditFieldChange("specifications", value || null)}
                        multiline
                        className={canEdit && isEditing ? "" : "pointer-events-none opacity-60"}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <InlineEditField
                        label="備考"
                        value={isEditing && editData ? (editData.notes || "") : (equipment.notes || "")}
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
          {isEditing && equipment && (
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

