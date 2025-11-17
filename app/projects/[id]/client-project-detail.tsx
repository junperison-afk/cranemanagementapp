"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";

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
  } | null;
  equipment: any[];
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
  const [project, setProject] = useState(initialProject);
  const [isSaving, setIsSaving] = useState(false);

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
      // 既存の関連データを保持
      setProject({
        ...updated,
        equipment: project.equipment,
        _count: project._count,
      });
      router.refresh();
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
            <h1 className="text-2xl font-bold text-gray-900">
              {project.title}
            </h1>
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
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              statusColors[project.status]
            }`}
          >
            {statusLabels[project.status]}
          </span>
        </div>
      </div>

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
            type="text"
            placeholder="YYYY-MM-DD"
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
            type="text"
            placeholder="YYYY-MM-DD"
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
        {/* 営業案件情報 */}
        {project.salesOpportunity && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              営業案件
            </h2>
            <Link
              href={`/sales-opportunities/${project.salesOpportunity.id}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {project.salesOpportunity.title}
            </Link>
          </div>
        )}

        {/* 担当者情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            担当者
          </h2>
          {project.assignedUser ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-900">
                {project.assignedUser.name || project.assignedUser.email}
              </p>
              <p className="text-sm text-gray-500">
                {project.assignedUser.email}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">担当者が設定されていません</p>
          )}
        </div>
      </div>

      {/* 機器情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            機器 ({project._count.equipment})
          </h2>
          {canEdit && (
            <Link
              href={`/projects/${project.id}/equipment/new`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              機器を追加
            </Link>
          )}
        </div>
        {project.equipment.length === 0 ? (
          <p className="text-sm text-gray-500">機器が登録されていません</p>
        ) : (
          <div className="space-y-2">
            {project.equipment.map((equipment) => (
              <div
                key={equipment.id}
                className="border-b border-gray-200 pb-2 last:border-0 last:pb-0"
              >
                <Link
                  href={`/equipment/${equipment.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {equipment.name} {equipment.model && `(${equipment.model})`}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

