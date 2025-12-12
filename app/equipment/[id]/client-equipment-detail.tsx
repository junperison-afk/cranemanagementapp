"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import ProjectSelectModal from "@/components/companies/project-select-modal";
import ProjectDetailModal from "@/components/companies/project-detail-modal";
import WorkRecordDetailModal from "@/components/work-records/work-record-detail-modal";
import HistoryTab from "@/components/common/history-tab";

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
    startDate: Date | null;
    endDate: Date | null;
    amount: number | null;
  } | null;
  inspectionRecords: {
    id: string;
    workType: string;
    inspectionDate: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
  _count: {
    inspectionRecords: number;
  };
}

interface ClientEquipmentDetailProps {
  equipment: Equipment;
  canEdit: boolean;
}

export default function ClientEquipmentDetail({
  equipment: initialEquipment,
  canEdit,
}: ClientEquipmentDetailProps) {
  // データが読み込まれたことを通知
  useEffect(() => {
    const event = new CustomEvent("page:content:loaded");
    window.dispatchEvent(event);
  }, [initialEquipment]);
  const router = useRouter();
  const { data: session } = useSession();
  const [equipment, setEquipment] = useState(initialEquipment);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isProjectSelectModalOpen, setIsProjectSelectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedWorkRecordId, setSelectedWorkRecordId] = useState<string | null>(null);

  const updateEquipment = async (field: string, value: any) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/equipment/${equipment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      const updated = await response.json();
      // 更新されたデータを反映
      setEquipment(updated);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (field: string, value: any) => {
    await updateEquipment(field, value);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/equipment"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {equipment.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              <Link
                href={`/companies/${equipment.company.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {equipment.company.name}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session?.user.role === "ADMIN" && (
            <DeleteItemButton
              apiPath="/api/equipment"
              itemId={equipment.id}
              resourceName="機器"
              redirectPath="/equipment"
            />
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            内容
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            編集履歴
          </button>
        </nav>
      </div>

      {activeTab === "overview" ? (
        <>
      {/* 基本情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InlineEditField
            label="機器名称"
            value={equipment.name}
            onSave={(value) => handleSave("name", value)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="機種・型式"
            value={equipment.model || ""}
            onSave={(value) => handleSave("model", value || null)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="製造番号"
            value={equipment.serialNumber || ""}
            onSave={(value) => handleSave("serialNumber", value || null)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="設置場所"
            value={equipment.location || ""}
            onSave={(value) => handleSave("location", value || null)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <div className="md:col-span-2">
            <InlineEditField
              label="仕様情報"
              value={equipment.specifications || ""}
              onSave={(value) => handleSave("specifications", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
          <div className="md:col-span-2">
            <InlineEditField
              label="備考"
              value={equipment.notes || ""}
              onSave={(value) => handleSave("notes", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
        </div>
      </div>

      {/* 関連情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 関連プロジェクト */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              関連プロジェクト ({equipment.project ? 1 : 0})
            </h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsProjectSelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </button>
            )}
          </div>
          {equipment.project ? (
            <button
              onClick={() => setSelectedProjectId(equipment.project!.id)}
              className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
            >
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">プロジェクトタイトル</p>
                  <p className="text-gray-900 mt-1 font-medium">
                    {equipment.project.title}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">開始日</p>
                  <p className="text-gray-900 mt-1">
                    {equipment.project.startDate
                      ? new Date(equipment.project.startDate).toLocaleDateString("ja-JP")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">終了日</p>
                  <p className="text-gray-900 mt-1">
                    {equipment.project.endDate
                      ? new Date(equipment.project.endDate).toLocaleDateString("ja-JP")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">金額</p>
                  <p className="text-gray-900 mt-1">
                    {equipment.project.amount
                      ? `¥${equipment.project.amount.toLocaleString("ja-JP")}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">ステータス</p>
                  <p className="text-gray-900 mt-1 font-medium">
                    {equipment.project.status === "IN_PROGRESS"
                      ? "進行中"
                      : equipment.project.status === "COMPLETED"
                      ? "完了"
                      : equipment.project.status === "PLANNING"
                      ? "計画中"
                      : equipment.project.status === "ON_HOLD"
                      ? "保留"
                      : equipment.project.status}
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <p className="text-sm text-gray-500">関連プロジェクトがありません</p>
          )}
        </div>

        {/* 作業記録情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              作業記録 ({equipment._count.inspectionRecords})
            </h2>
            {canEdit && (
              <Link
                href={`/work-records/new?equipmentId=${equipment.id}`}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </Link>
            )}
          </div>
          {equipment.inspectionRecords.length === 0 ? (
            <p className="text-sm text-gray-500">作業記録がありません</p>
          ) : (
            <div className="space-y-3">
              {equipment.inspectionRecords.map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedWorkRecordId(record.id)}
                  className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                >
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">作業タイプ</p>
                      <p className="text-gray-900 mt-1 font-medium">
                        {record.workType === "INSPECTION"
                          ? "点検"
                          : record.workType === "REPAIR"
                          ? "修理"
                          : record.workType === "MAINTENANCE"
                          ? "メンテナンス"
                          : record.workType === "OTHER"
                          ? "その他"
                          : record.workType || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">作業日</p>
                      <p className="text-gray-900 mt-1">
                        {new Date(record.inspectionDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">担当者</p>
                      <p className="text-gray-900 mt-1">
                        {record.user.name || record.user.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      ) : (
        <HistoryTab entityType="Equipment" entityId={equipment.id} />
      )}

      {/* プロジェクト選択モーダル */}
      <ProjectSelectModal
        isOpen={isProjectSelectModalOpen}
        onClose={() => setIsProjectSelectModalOpen(false)}
        companyId={equipment.company.id}
        onSelect={async (projectId) => {
          try {
            const response = await fetch(`/api/equipment/${equipment.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: projectId,
              }),
            });

            if (!response.ok) {
              throw new Error("プロジェクトの関連付けに失敗しました");
            }

            const updated = await response.json();
            setEquipment({
              ...updated,
              inspectionRecords: equipment.inspectionRecords,
              _count: equipment._count,
            });
          } catch (error) {
            console.error("プロジェクト関連付けエラー:", error);
            alert("プロジェクトの関連付けに失敗しました");
            throw error;
          }
        }}
      />

      {/* プロジェクト詳細モーダル */}
      {selectedProjectId && (
        <ProjectDetailModal
          isOpen={!!selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          projectId={selectedProjectId}
          canEdit={canEdit}
          onUnlink={async () => {
            // 機器のプロジェクトをnullにする
            try {
              const response = await fetch(`/api/equipment/${equipment.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  projectId: null,
                }),
              });

              if (!response.ok) {
                throw new Error("プロジェクトの関連外しに失敗しました");
              }

              const updated = await response.json();
              setEquipment({
                ...updated,
                inspectionRecords: equipment.inspectionRecords,
                _count: equipment._count,
              });
            } catch (error) {
              console.error("プロジェクト関連外しエラー:", error);
              throw error;
            }
          }}
        />
      )}

      {/* 作業記録詳細モーダル */}
      {selectedWorkRecordId && (
        <WorkRecordDetailModal
          isOpen={!!selectedWorkRecordId}
          onClose={() => {
            setSelectedWorkRecordId(null);
            router.refresh();
          }}
          workRecordId={selectedWorkRecordId}
        />
      )}
    </div>
  );
}

