"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";

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
  inspectionRecords: any[];
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
  const router = useRouter();
  const { data: session } = useSession();
  const [equipment, setEquipment] = useState(initialEquipment);
  const [isSaving, setIsSaving] = useState(false);

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
      // 既存の関連データを保持して即座に更新（router.refreshは不要）
      setEquipment({
        ...updated,
        inspectionRecords: equipment.inspectionRecords,
        _count: equipment._count,
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
        {/* 関連プロジェクト情報 */}
        {equipment.project && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              関連プロジェクト
            </h2>
            <Link
              href={`/projects/${equipment.project.id}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {equipment.project.title}
            </Link>
          </div>
        )}

        {/* 作業記録情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              作業記録 ({equipment._count.inspectionRecords})
            </h2>
            {canEdit && (
              <Link
                href={`/work-records/new?equipmentId=${equipment.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 追加
              </Link>
            )}
          </div>
          {equipment.inspectionRecords.length === 0 ? (
            <p className="text-sm text-gray-500">作業記録がありません</p>
          ) : (
            <div className="space-y-2">
              {equipment.inspectionRecords.map((record) => (
                <div
                  key={record.id}
                  className="border-b border-gray-200 pb-2 last:border-0 last:pb-0"
                >
                  <Link
                    href={`/work-records/${record.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {new Date(record.inspectionDate).toLocaleDateString("ja-JP")}{" "}
                    - {record.user.name || record.user.email}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

