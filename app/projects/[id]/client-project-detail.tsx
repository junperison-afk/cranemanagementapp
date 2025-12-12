"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";
import InlineEditLookup from "@/components/companies/inline-edit-lookup";
import CompanyCreateForm from "@/components/companies/company-create-form";
import SalesOpportunityCreateForm from "@/components/sales-opportunities/sales-opportunity-create-form";
import ContactCreateForm from "@/components/contacts/contact-create-form";
import EquipmentSelectModal from "@/components/projects/equipment-select-modal";
import SalesOpportunitySelectModal from "@/components/projects/sales-opportunity-select-modal";
import ContactSelectModal from "@/components/projects/contact-select-modal";
import SalesOpportunityDetailModal from "@/components/projects/sales-opportunity-detail-modal";
import ContactDetailModal from "@/components/projects/contact-detail-modal";
import UserDetailModal from "@/components/projects/user-detail-modal";
import EquipmentDetailModal from "@/components/projects/equipment-detail-modal";
import InspectionRecordModal from "@/components/projects/inspection-record-modal";
import WorkRecordDetailModal from "@/components/work-records/work-record-detail-modal";
import WorkRecordBulkPrintModal from "@/components/projects/work-record-bulk-print-modal";
import HistoryTab from "@/components/common/history-tab";

interface Project {
  id: string;
  title: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  startDate: Date | null;
  endDate: Date | null;
  amount: number | null;
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
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  salesOpportunity: {
    id: string;
    title: string;
    status: string;
    estimatedAmount: number | null;
    occurredAt: Date | null;
  } | null;
  equipment: Array<{
    id: string;
    name: string;
    model: string | null;
    serialNumber: string | null;
    location: string | null;
    _count: {
      inspectionRecords: number;
    };
    inspectionRecords: Array<{
      id: string;
      inspectionDate: Date;
      workType: string;
      equipment: {
        id: string;
        name: string;
        model: string | null;
      };
    }>;
  }>;
  _count: {
    equipment: number;
  };
}

interface ClientProjectDetailProps {
  project: Project;
  canEdit: boolean;
}

const statusOptions = [
  { value: "PLANNING", label: "計画中" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "ON_HOLD", label: "保留" },
  { value: "COMPLETED", label: "完了" },
];

const statusLabels: Record<string, string> = {
  PLANNING: "計画中",
  IN_PROGRESS: "進行中",
  ON_HOLD: "保留",
  COMPLETED: "完了",
};

const statusColors: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function ClientProjectDetail({
  project: initialProject,
  canEdit,
}: ClientProjectDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState(initialProject);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [selectedEquipmentForWorkRecord, setSelectedEquipmentForWorkRecord] = useState<string | null>(null);
  const [selectedWorkRecordId, setSelectedWorkRecordId] = useState<string | null>(null);
  const [isSalesOpportunitySelectModalOpen, setIsSalesOpportunitySelectModalOpen] = useState(false);
  const [isContactSelectModalOpen, setIsContactSelectModalOpen] = useState(false);
  const [selectedSalesOpportunityId, setSelectedSalesOpportunityId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  const updateProject = async (field: string, value: any) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
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
      // 既存の関連データを保持して即座に更新（router.refreshは不要）
      setProject({
        ...updated,
        equipment: project.equipment,
        _count: project._count,
      });
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (field: string, value: any) => {
    await updateProject(field, value);
  };

  // 機器を選択してプロジェクトに紐付ける（複数対応）
  const handleEquipmentSelect = async (equipmentList: Array<{ id: string }>) => {
    if (!canEdit || equipmentList.length === 0) return;

    setIsSaving(true);
    try {
      // 選択した全ての機器をプロジェクトに紐付ける
      const promises = equipmentList.map((equipment) =>
        fetch(`/api/equipment/${equipment.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project.id,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const failed = responses.some((response) => !response.ok);

      if (failed) {
        throw new Error("機器の紐付けに失敗しました");
      }

      // プロジェクトデータを再取得して即座に反映
      const projectResponse = await fetch(`/api/projects/${project.id}`);
      if (projectResponse.ok) {
        const updatedProject = await projectResponse.json();
        setProject(updatedProject);
      } else {
        // 再取得に失敗した場合はページをリフレッシュ
        router.refresh();
      }
    } catch (error) {
      console.error("機器紐付けエラー:", error);
      alert("機器の紐付けに失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {project.title}
            </h1>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  statusColors[project.status]
                }`}
              >
                {statusLabels[project.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              <Link
                href={`/companies/${project.company.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {project.company.name}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session?.user.role === "ADMIN" && (
            <DeleteItemButton
              apiPath="/api/projects"
              itemId={project.id}
              resourceName="プロジェクト"
              redirectPath="/projects"
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
            label="プロジェクトタイトル"
            value={project.title}
            onSave={(value) => handleSave("title", value)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditLookup
            label="関連取引先"
            value={project.company.id}
            onSave={(value) => handleSave("companyId", value)}
            apiEndpoint="/api/companies"
            displayKey="name"
            secondaryKey="address"
            itemsKey="companies"
            placeholder="例: 株式会社○○工業"
            createNewUrl="/companies/new"
            returnUrl={`/projects/${project.id}`}
            canEdit={canEdit}
            createFormComponent={CompanyCreateForm}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditSelect
            label="ステータス"
            value={project.status}
            onSave={(value) => handleSave("status", value)}
            options={statusOptions}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="金額"
            value={project.amount ? String(project.amount) : ""}
            onSave={(value) => handleSave("amount", value ? value : null)}
            type="text"
            placeholder="例: 1000000"
            formatNumber={true}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="開始日"
            value={
              project.startDate
                ? new Date(project.startDate).toISOString().split("T")[0]
                : ""
            }
            onSave={(value) =>
              handleSave("startDate", value ? new Date(value).toISOString() : null)
            }
            type="date"
            placeholder="日付を選択"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="終了日"
            value={
              project.endDate
                ? new Date(project.endDate).toISOString().split("T")[0]
                : ""
            }
            onSave={(value) =>
              handleSave("endDate", value ? new Date(value).toISOString() : null)
            }
            type="date"
            placeholder="日付を選択"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <div className="md:col-span-2">
            <InlineEditField
              label="備考"
              value={project.notes || ""}
              onSave={(value) => handleSave("notes", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
        </div>
      </div>

      {/* 関連情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 関連営業案件情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              関連営業案件 ({project.salesOpportunity ? 1 : 0})
            </h2>
            {canEdit && (
              <button
                onClick={() => setIsSalesOpportunitySelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </button>
            )}
          </div>
          {project.salesOpportunity ? (
            <button
              onClick={() => setSelectedSalesOpportunityId(project.salesOpportunity!.id)}
              className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
            >
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">発生日</p>
                  <p className="text-gray-900 mt-1">
                    {project.salesOpportunity.occurredAt
                      ? new Date(
                          project.salesOpportunity.occurredAt
                        ).toLocaleDateString("ja-JP")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">見積金額</p>
                  <p className="text-gray-900 mt-1">
                    {project.salesOpportunity.estimatedAmount
                      ? `¥${project.salesOpportunity.estimatedAmount.toLocaleString("ja-JP")}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">ステータス</p>
                  <p className="text-gray-900 mt-1">
                    {project.salesOpportunity.status === "ESTIMATING"
                      ? "見積中"
                      : project.salesOpportunity.status === "WON"
                      ? "受注"
                      : project.salesOpportunity.status === "LOST"
                      ? "失注"
                      : project.salesOpportunity.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">案件タイトル</p>
                  <p className="text-gray-900 mt-1 font-medium">
                    {project.salesOpportunity.title}
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <p className="text-sm text-gray-500">関連営業案件がありません</p>
          )}
        </div>

        {/* 関連連絡先情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              関連連絡先 ({project.assignedUser ? 1 : 0})
            </h2>
            {canEdit && (
              <button
                onClick={() => setIsContactSelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </button>
            )}
          </div>
          {project.assignedUser ? (
            <button
              onClick={() => setSelectedUserId(project.assignedUser!.id)}
              className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
            >
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">氏名</p>
                  <p className="text-gray-900 mt-1 font-medium">
                    {project.assignedUser.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">電話</p>
                  <p className="text-gray-900 mt-1">
                    {project.assignedUser.phone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">メール</p>
                  <p className="text-gray-900 mt-1">
                    {project.assignedUser.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">役割</p>
                  <p className="text-gray-900 mt-1">
                    担当者
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <p className="text-sm text-gray-500">関連連絡先がありません</p>
          )}
        </div>
      </div>

      {/* 関連機器情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            関連機器 ({project._count.equipment})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkPrintModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              作業記録一括印刷
            </button>
            {canEdit && (
              <button
                onClick={() => setIsEquipmentModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </button>
            )}
          </div>
        </div>
        {project.equipment.length === 0 ? (
          <p className="text-sm text-gray-500">関連機器が登録されていません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    機器名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    機種
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    製造番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    設置場所
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作業記録登録状況
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作業記録データ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
            {project.equipment.map((equipment) => (
                  <tr key={equipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => setSelectedEquipmentId(equipment.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                        {equipment.name}
                </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {equipment.model || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {equipment.serialNumber || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {equipment.location || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          equipment._count && equipment._count.inspectionRecords > 0 ? (
                            <button
                              disabled
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium text-gray-500 bg-gray-100 rounded-md cursor-not-allowed"
                            >
                              作業記録登録済
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedEquipmentForWorkRecord(equipment.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              作業記録登録
                            </button>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {equipment._count && equipment._count.inspectionRecords > 0 ? (
                          <span className="text-green-600 font-medium">
                            登録済
                            {/* デバッグ用: 実際のカウント値を表示 */}
                            {/* ({equipment._count.inspectionRecords}) */}
                          </span>
                        ) : (
                          <span className="text-gray-500">未登録</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {equipment.inspectionRecords && equipment.inspectionRecords.length > 0 ? (
                          <div className="space-y-1">
                            {equipment.inspectionRecords.map((record) => {
                              const workTypeLabels: Record<string, string> = {
                                INSPECTION: "点検",
                                REPAIR: "修理",
                                MAINTENANCE: "メンテナンス",
                                OTHER: "その他",
                              };
                              const inspectionDate = new Date(record.inspectionDate);
                              const formattedDate = inspectionDate.toLocaleDateString("ja-JP");
                              return (
                                <button
                                  key={record.id}
                                  onClick={() => setSelectedWorkRecordId(record.id)}
                                  className="block text-left text-blue-600 hover:text-blue-800"
                                >
                                  {workTypeLabels[record.workType] || record.workType} - {formattedDate}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
            ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      ) : (
        <HistoryTab entityType="Project" entityId={project.id} />
      )}

      {/* 機器選択モーダル */}
      {project.company && (
        <EquipmentSelectModal
          isOpen={isEquipmentModalOpen}
          onClose={() => setIsEquipmentModalOpen(false)}
          onSelect={handleEquipmentSelect}
          companyId={project.company.id}
          projectId={project.id}
        />
      )}

      {/* 作業記録登録モーダル */}
      {selectedEquipmentForWorkRecord && (
        <InspectionRecordModal
          isOpen={!!selectedEquipmentForWorkRecord}
          onClose={() => setSelectedEquipmentForWorkRecord(null)}
          equipmentId={selectedEquipmentForWorkRecord}
          onSuccess={async () => {
            // 作業記録登録後、プロジェクトデータを再取得
            const projectResponse = await fetch(`/api/projects/${project.id}`);
            if (projectResponse.ok) {
              const updatedProject = await projectResponse.json();
              setProject(updatedProject);
            } else {
              router.refresh();
            }
          }}
        />
      )}

      {/* 作業記録詳細モーダル */}
      {selectedWorkRecordId && (
        <WorkRecordDetailModal
          isOpen={!!selectedWorkRecordId}
          onClose={() => setSelectedWorkRecordId(null)}
          workRecordId={selectedWorkRecordId}
        />
      )}

      {/* 作業記録一括印刷モーダル */}
      <WorkRecordBulkPrintModal
        isOpen={isBulkPrintModalOpen}
        onClose={() => setIsBulkPrintModalOpen(false)}
        projectId={project.id}
        workRecords={project.equipment.flatMap((eq) =>
          eq.inspectionRecords.map((record) => ({
            id: record.id,
            inspectionDate: record.inspectionDate,
            workType: record.workType,
            equipment: {
              id: eq.id,
              name: eq.name,
              model: eq.model,
            },
          }))
        )}
      />

      {/* 営業案件選択モーダル */}
      {project.company && (
        <SalesOpportunitySelectModal
          isOpen={isSalesOpportunitySelectModalOpen}
          onClose={() => setIsSalesOpportunitySelectModalOpen(false)}
          companyId={project.company.id}
          currentProjectId={project.id}
          onSelect={async (salesOpportunityId: string) => {
            // プロジェクトのsalesOpportunityIdを更新
            try {
              await handleSave("salesOpportunityId", salesOpportunityId);
              // プロジェクトデータを再取得
              const projectResponse = await fetch(`/api/projects/${project.id}`);
              if (projectResponse.ok) {
                const updatedProject = await projectResponse.json();
                setProject({
                  ...updatedProject,
                  equipment: project.equipment,
                  _count: project._count,
                });
              }
            } catch (error) {
              console.error("営業案件関連付けエラー:", error);
              throw error;
            }
          }}
        />
      )}

      {/* 連絡先選択モーダル */}
      {project.company && (
        <ContactSelectModal
          isOpen={isContactSelectModalOpen}
          onClose={() => setIsContactSelectModalOpen(false)}
          companyId={project.company.id}
          onSelect={async (contactId: string) => {
            // プロジェクトのassignedUserIdを更新
            // 注意: プロジェクトのassignedUserIdはUserを参照しているため、
            // 連絡先IDをそのまま使用できない可能性があります
            // ここでは連絡先IDをassignedUserIdとして設定しますが、
            // 実際の実装では連絡先とUserのマッピングが必要かもしれません
            try {
              await handleSave("assignedUserId", contactId);
              // プロジェクトデータを再取得
              const projectResponse = await fetch(`/api/projects/${project.id}`);
              if (projectResponse.ok) {
                const updatedProject = await projectResponse.json();
                setProject({
                  ...updatedProject,
                  equipment: project.equipment,
                  _count: project._count,
                });
              }
            } catch (error) {
              console.error("連絡先関連付けエラー:", error);
              throw error;
            }
          }}
        />
      )}

      {/* 営業案件詳細モーダル */}
      {selectedSalesOpportunityId && (
        <SalesOpportunityDetailModal
          isOpen={!!selectedSalesOpportunityId}
          onClose={() => setSelectedSalesOpportunityId(null)}
          salesOpportunityId={selectedSalesOpportunityId}
          canEdit={canEdit}
          onUnlink={async () => {
            // プロジェクトのsalesOpportunityIdをnullにする
            try {
              await handleSave("salesOpportunityId", null);
              // プロジェクトデータを再取得
              const projectResponse = await fetch(`/api/projects/${project.id}`);
              if (projectResponse.ok) {
                const updatedProject = await projectResponse.json();
                setProject({
                  ...updatedProject,
                  equipment: project.equipment,
                  _count: project._count,
                });
              }
            } catch (error) {
              console.error("営業案件関連外しエラー:", error);
              throw error;
            }
          }}
        />
      )}

      {/* ユーザー詳細モーダル */}
      {selectedUserId && (
        <UserDetailModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userId={selectedUserId}
          canEdit={canEdit}
          onUnlink={async () => {
            // プロジェクトのassignedUserIdをnullにする
            try {
              await handleSave("assignedUserId", null);
              // プロジェクトデータを再取得
              const projectResponse = await fetch(`/api/projects/${project.id}`);
              if (projectResponse.ok) {
                const updatedProject = await projectResponse.json();
                setProject({
                  ...updatedProject,
                  equipment: project.equipment,
                  _count: project._count,
                });
              }
            } catch (error) {
              console.error("ユーザー関連外しエラー:", error);
              throw error;
            }
          }}
        />
      )}

      {/* 機器詳細モーダル */}
      {selectedEquipmentId && (
        <EquipmentDetailModal
          isOpen={!!selectedEquipmentId}
          onClose={() => setSelectedEquipmentId(null)}
          equipmentId={selectedEquipmentId}
          canEdit={canEdit}
          onUnlink={async () => {
            // 機器のprojectIdをnullにする
            try {
              const response = await fetch(`/api/equipment/${selectedEquipmentId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  projectId: null,
                }),
              });

              if (!response.ok) {
                throw new Error("関連から外すのに失敗しました");
              }

              // プロジェクトデータを再取得
              const projectResponse = await fetch(`/api/projects/${project.id}`);
              if (projectResponse.ok) {
                const updatedProject = await projectResponse.json();
                setProject({
                  ...updatedProject,
                  equipment: updatedProject.equipment || project.equipment,
                  _count: updatedProject._count || project._count,
                });
              }
            } catch (error) {
              console.error("機器関連外しエラー:", error);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}

