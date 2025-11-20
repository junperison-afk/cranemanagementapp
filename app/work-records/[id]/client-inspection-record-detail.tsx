"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";

interface WorkRecord {
  id: string;
  workType: "INSPECTION" | "REPAIR" | "MAINTENANCE" | "OTHER";
  inspectionDate: Date;
  overallJudgment: "GOOD" | "CAUTION" | "BAD" | "REPAIR" | null;
  findings: string | null;
  summary: string | null;
  additionalNotes: string | null;
  checklistData: string | null;
  photos: string | null;
  updatedAt: Date;
  equipment: {
    id: string;
    name: string;
    model: string | null;
    serialNumber: string | null;
    location: string | null;
    company: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface ClientWorkRecordDetailProps {
  workRecord: WorkRecord;
  canEdit: boolean;
}

const workTypeOptions = [
  { value: "INSPECTION", label: "点検" },
  { value: "REPAIR", label: "修理" },
  { value: "MAINTENANCE", label: "メンテナンス" },
  { value: "OTHER", label: "その他" },
];

const workTypeLabels: Record<string, string> = {
  INSPECTION: "点検",
  REPAIR: "修理",
  MAINTENANCE: "メンテナンス",
  OTHER: "その他",
};

const workTypeColors: Record<string, string> = {
  INSPECTION: "bg-blue-100 text-blue-800",
  REPAIR: "bg-red-100 text-red-800",
  MAINTENANCE: "bg-purple-100 text-purple-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const judgmentOptions = [
  { value: "GOOD", label: "良好" },
  { value: "CAUTION", label: "注意" },
  { value: "BAD", label: "不良" },
  { value: "REPAIR", label: "要修理" },
];

const judgmentLabels: Record<string, string> = {
  GOOD: "良好",
  CAUTION: "注意",
  BAD: "不良",
  REPAIR: "要修理",
};

const judgmentColors: Record<string, string> = {
  GOOD: "bg-green-100 text-green-800",
  CAUTION: "bg-yellow-100 text-yellow-800",
  BAD: "bg-orange-100 text-orange-800",
  REPAIR: "bg-red-100 text-red-800",
};

export default function ClientWorkRecordDetail({
  workRecord: initialWorkRecord,
  canEdit,
}: ClientWorkRecordDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [workRecord, setWorkRecord] = useState(initialWorkRecord);
  const [isSaving, setIsSaving] = useState(false);

  const updateWorkRecord = async (field: string, value: any) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/work-records/${workRecord.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [field]: value,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      const updated = await response.json();
      setWorkRecord(updated);
      // router.refresh()は不要（APIレスポンスで既に最新データを取得している）
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (field: string, value: any) => {
    await updateWorkRecord(field, value);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/work-records"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {new Date(workRecord.inspectionDate).toLocaleDateString(
                "ja-JP"
              )}{" "}
              の作業記録
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              <Link
                href={`/equipment/${workRecord.equipment.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {workRecord.equipment.name}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              workTypeColors[workRecord.workType]
            }`}
          >
            {workTypeLabels[workRecord.workType]}
          </span>
          {workRecord.overallJudgment && (
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                judgmentColors[workRecord.overallJudgment]
              }`}
            >
              {judgmentLabels[workRecord.overallJudgment]}
            </span>
          )}
          {session?.user.role === "ADMIN" && (
            <DeleteItemButton
              apiPath="/api/work-records"
              itemId={workRecord.id}
              resourceName="作業記録"
              redirectPath="/work-records"
            />
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InlineEditSelect
            label="作業タイプ"
            value={workRecord.workType}
            onSave={(value) => handleSave("workType", value)}
            options={workTypeOptions}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="作業日"
            value={new Date(workRecord.inspectionDate)
              .toISOString()
              .split("T")[0]}
            onSave={(value) =>
              handleSave("inspectionDate", new Date(value).toISOString())
            }
            type="date"
            placeholder="日付を選択"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          {workRecord.workType === "INSPECTION" && (
            <InlineEditSelect
              label="総合判定"
              value={workRecord.overallJudgment || ""}
              onSave={(value) => handleSave("overallJudgment", value || null)}
              options={judgmentOptions}
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          )}
          <div className="md:col-span-2">
            <InlineEditField
              label="所見"
              value={workRecord.findings || ""}
              onSave={(value) => handleSave("findings", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
          <div className="md:col-span-2">
            <InlineEditField
              label="結果サマリ"
              value={workRecord.summary || ""}
              onSave={(value) => handleSave("summary", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
          <div className="md:col-span-2">
            <InlineEditField
              label="追加項目メモ"
              value={workRecord.additionalNotes || ""}
              onSave={(value) => handleSave("additionalNotes", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
        </div>
      </div>

      {/* 関連情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 関連機器情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">関連機器情報</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">関連機器名称</p>
              <Link
                href={`/equipment/${workRecord.equipment.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {workRecord.equipment.name}
              </Link>
            </div>
            {workRecord.equipment.model && (
              <div>
                <p className="text-sm text-gray-500">機種・型式</p>
                <p className="text-sm text-gray-900">
                  {workRecord.equipment.model}
                </p>
              </div>
            )}
            {workRecord.equipment.serialNumber && (
              <div>
                <p className="text-sm text-gray-500">製造番号</p>
                <p className="text-sm text-gray-900">
                  {workRecord.equipment.serialNumber}
                </p>
              </div>
            )}
            {workRecord.equipment.location && (
              <div>
                <p className="text-sm text-gray-500">設置場所</p>
                <p className="text-sm text-gray-900">
                  {workRecord.equipment.location}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">関連取引先</p>
              <Link
                href={`/companies/${workRecord.equipment.company.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {workRecord.equipment.company.name}
              </Link>
            </div>
          </div>
        </div>

        {/* 担当者情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">担当者</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">氏名</p>
              <p className="text-sm text-gray-900">
                {workRecord.user.name || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">メール</p>
              <p className="text-sm text-gray-900">
                {workRecord.user.email}
              </p>
            </div>
            {workRecord.user.phone && (
              <div>
                <p className="text-sm text-gray-500">電話番号</p>
                <p className="text-sm text-gray-900">
                  {workRecord.user.phone}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

