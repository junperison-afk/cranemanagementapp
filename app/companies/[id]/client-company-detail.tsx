"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
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
  contacts: any[];
  salesOpportunities: any[];
  equipment: any[];
  projects: any[];
  _count?: {
    contacts: number;
    salesOpportunities: number;
    equipment: number;
    projects: number;
  };
}

interface ClientCompanyDetailProps {
  company: Company;
  canEdit: boolean;
}

export default function ClientCompanyDetail({
  company: initialCompany,
  canEdit,
}: ClientCompanyDetailProps) {
  const router = useRouter();
  const [company, setCompany] = useState(initialCompany);
  const [isSaving, setIsSaving] = useState(false);

  const updateCompany = async (field: string, value: any) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
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

      const updatedCompany = await response.json();
      // 既存の関連データを保持
      setCompany({
        ...updatedCompany,
        contacts: company.contacts,
        salesOpportunities: company.salesOpportunities,
        equipment: company.equipment,
        projects: company.projects,
        _count: company._count,
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
    await updateCompany(field, value);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/companies"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              最終更新:{" "}
              {new Date(company.updatedAt).toLocaleString("ja-JP")}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="text-sm text-gray-500">
            {isSaving && "保存中..."}
          </div>
        )}
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            概要
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            履歴
          </button>
        </nav>
      </div>

      {/* 基本情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          基本情報
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {canEdit ? (
            <>
              <InlineEditField
                label="会社名"
                value={company.name}
                onSave={(value) => handleSave("name", value)}
                placeholder="会社名を入力"
              />
              <InlineEditField
                label="郵便番号"
                value={company.postalCode}
                onSave={(value) => handleSave("postalCode", value || null)}
                placeholder="郵便番号を入力"
              />
              <div className="md:col-span-2">
                <InlineEditField
                  label="住所"
                  value={company.address}
                  onSave={(value) => handleSave("address", value || null)}
                  placeholder="住所を入力"
                  multiline
                />
              </div>
              <InlineEditField
                label="電話番号"
                value={company.phone}
                onSave={(value) => handleSave("phone", value || null)}
                type="tel"
                placeholder="電話番号を入力"
              />
              <InlineEditField
                label="メールアドレス"
                value={company.email}
                onSave={(value) => handleSave("email", value || null)}
                type="email"
                placeholder="メールアドレスを入力"
              />
              <InlineEditField
                label="業種"
                value={company.industryType}
                onSave={(value) => handleSave("industryType", value || null)}
                placeholder="業種を入力"
              />
              <InlineEditSelect
                label="請求フラグ"
                value={company.billingFlag}
                onSave={(value) => handleSave("billingFlag", value as boolean)}
                options={[
                  { value: "true", label: "有効" },
                  { value: "false", label: "無効" },
                ]}
                booleanMode={true}
              />
              <div className="md:col-span-2">
                <InlineEditField
                  label="備考"
                  value={company.notes}
                  onSave={(value) => handleSave("notes", value || null)}
                  placeholder="備考を入力"
                  multiline
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  会社名
                </label>
                <p className="mt-1 text-sm text-gray-900">{company.name}</p>
              </div>
              {company.postalCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    郵便番号
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    〒{company.postalCode}
                  </p>
                </div>
              )}
              {company.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">
                    住所
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{company.address}</p>
                </div>
              )}
              {company.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    電話番号
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{company.phone}</p>
                </div>
              )}
              {company.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    メールアドレス
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{company.email}</p>
                </div>
              )}
              {company.industryType && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    業種
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {company.industryType}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  請求フラグ
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {company.billingFlag ? "有効" : "無効"}
                </p>
              </div>
              {company.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">
                    備考
                  </label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {company.notes}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 関連情報 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 担当者一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              担当者 ({company._count?.contacts ?? company.contacts.length})
            </h2>
            {canEdit && (
              <Link
                href={`/companies/${company.id}/contacts/new`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 追加
              </Link>
            )}
          </div>
          {company.contacts.length === 0 ? (
            <p className="text-sm text-gray-500">
              担当者が登録されていません
            </p>
          ) : (
            <div className="space-y-3">
              {company.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border-b border-gray-100 pb-3 last:border-0"
                >
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  {contact.position && (
                    <p className="text-sm text-gray-500">{contact.position}</p>
                  )}
                  {contact.phone && (
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  )}
                  {contact.email && (
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 営業案件一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              営業案件 ({company._count?.salesOpportunities ?? company.salesOpportunities.length})
            </h2>
            {canEdit && (
              <Link
                href={`/sales-opportunities/new?companyId=${company.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 追加
              </Link>
            )}
          </div>
          {company.salesOpportunities.length === 0 ? (
            <p className="text-sm text-gray-500">
              営業案件が登録されていません
            </p>
          ) : (
            <div className="space-y-3">
              {company.salesOpportunities.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={`/sales-opportunities/${opportunity.id}`}
                  className="block border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 -mx-3 px-3 rounded"
                >
                  <p className="font-medium text-gray-900">
                    {opportunity.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        opportunity.status === "WON"
                          ? "bg-green-100 text-green-800"
                          : opportunity.status === "LOST"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {opportunity.status === "WON"
                        ? "受注"
                        : opportunity.status === "LOST"
                        ? "失注"
                        : "見積中"}
                    </span>
                    <span className="text-xs text-gray-500">
                      見積: {opportunity._count.quotes}件
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* プロジェクト一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              プロジェクト ({company._count?.projects ?? company.projects.length})
            </h2>
          </div>
          {company.projects.length === 0 ? (
            <p className="text-sm text-gray-500">
              プロジェクトが登録されていません
            </p>
          ) : (
            <div className="space-y-3">
              {company.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 -mx-3 px-3 rounded"
                >
                  <p className="font-medium text-gray-900">{project.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        project.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : project.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status === "IN_PROGRESS"
                        ? "進行中"
                        : project.status === "COMPLETED"
                        ? "完了"
                        : project.status === "PLANNING"
                        ? "計画中"
                        : project.status}
                    </span>
                    {project.assignedUser && (
                      <span className="text-xs text-gray-500">
                        {project.assignedUser.name || project.assignedUser.email}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 機器一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              機器 ({company._count?.equipment ?? company.equipment.length})
            </h2>
            {canEdit && (
              <Link
                href={`/equipment/new?companyId=${company.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 追加
              </Link>
            )}
          </div>
          {company.equipment.length === 0 ? (
            <p className="text-sm text-gray-500">機器が登録されていません</p>
          ) : (
            <div className="space-y-3">
              {company.equipment.map((equipment) => (
                <Link
                  key={equipment.id}
                  href={`/equipment/${equipment.id}`}
                  className="block border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 -mx-3 px-3 rounded"
                >
                  <p className="font-medium text-gray-900">{equipment.name}</p>
                  {equipment.model && (
                    <p className="text-sm text-gray-500">{equipment.model}</p>
                  )}
                  {equipment.location && (
                    <p className="text-sm text-gray-500">
                      設置場所: {equipment.location}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

