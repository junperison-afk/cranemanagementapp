"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";
import ContactCreateForm from "@/components/contacts/contact-create-form";
import SalesOpportunityCreateForm from "@/components/sales-opportunities/sales-opportunity-create-form";
import ProjectCreateForm from "@/components/projects/project-create-form";
import HistoryTab from "@/components/common/history-tab";

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
  const { data: session } = useSession();
  const [company, setCompany] = useState(initialCompany);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSalesOpportunityModalOpen, setIsSalesOpportunityModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

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
      // 既存の関連データを保持して即座に更新（router.refreshは不要）
      setCompany({
        ...updatedCompany,
        contacts: company.contacts,
        salesOpportunities: company.salesOpportunities,
        equipment: company.equipment,
        projects: company.projects,
        _count: company._count,
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
    await updateCompany(field, value);
  };

  const handleContactCreateSuccess = (contact: any) => {
    setIsContactModalOpen(false);
    // 作成した連絡先を即座にローカル状態に追加（API呼び出し不要）
    setCompany((prev) => ({
      ...prev,
      contacts: [contact, ...prev.contacts],
      _count: prev._count
        ? {
            ...prev._count,
            contacts: prev._count.contacts + 1,
          }
        : {
            contacts: prev.contacts.length + 1,
            salesOpportunities: prev.salesOpportunities.length,
            equipment: prev.equipment.length,
            projects: prev.projects.length,
          },
    }));
  };

  const handleContactCreateCancel = () => {
    setIsContactModalOpen(false);
  };

  const handleSalesOpportunityCreateSuccess = (salesOpportunity: any) => {
    setIsSalesOpportunityModalOpen(false);
    // 作成した営業案件を即座にローカル状態に追加（API呼び出し不要）
    // _count.quotesを0として設定（新規作成なので見積は0件）
    setCompany((prev) => ({
      ...prev,
      salesOpportunities: [
        { ...salesOpportunity, _count: { quotes: 0 } },
        ...prev.salesOpportunities,
      ],
      _count: prev._count
        ? {
            ...prev._count,
            salesOpportunities: prev._count.salesOpportunities + 1,
          }
        : {
            contacts: prev.contacts.length,
            salesOpportunities: prev.salesOpportunities.length + 1,
            equipment: prev.equipment.length,
            projects: prev.projects.length,
          },
    }));
  };

  const handleSalesOpportunityCreateCancel = () => {
    setIsSalesOpportunityModalOpen(false);
  };

  const handleProjectCreateSuccess = (projectId: string) => {
    setIsProjectModalOpen(false);
    // 作成したプロジェクトの詳細画面に遷移
    router.push(`/projects/${projectId}`);
    router.refresh();
  };

  const handleProjectCreateCancel = () => {
    setIsProjectModalOpen(false);
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
        <div className="flex items-center gap-3">
          {session?.user.role === "ADMIN" && (
            <DeleteItemButton
              apiPath="/api/companies"
              itemId={company.id}
              resourceName="取引先"
              redirectPath="/companies"
            />
          )}
          {canEdit && (
            <div className="text-sm text-gray-500">
              {isSaving && "保存中..."}
            </div>
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
            概要
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            履歴
          </button>
        </nav>
      </div>

      {activeTab === "overview" ? (
        <>
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
        {/* 関連連絡先一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              関連連絡先 ({company._count?.contacts ?? company.contacts.length})
            </h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 追加
              </button>
            )}
          </div>
          {company.contacts.length === 0 ? (
            <p className="text-sm text-gray-500">
              関連連絡先が登録されていません
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

        {/* 関連営業案件一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              関連営業案件 ({company._count?.salesOpportunities ?? company.salesOpportunities.length})
            </h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsSalesOpportunityModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 追加
              </button>
            )}
          </div>
          {company.salesOpportunities.length === 0 ? (
            <p className="text-sm text-gray-500">
              関連営業案件が登録されていません
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

        {/* 関連プロジェクト一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              関連プロジェクト ({company._count?.projects ?? company.projects.length})
            </h2>
            {canEdit && (
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + 追加
              </button>
            )}
          </div>
          {company.projects.length === 0 ? (
            <p className="text-sm text-gray-500">
              関連プロジェクトが登録されていません
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
                          : project.status === "ON_HOLD"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status === "IN_PROGRESS"
                        ? "進行中"
                        : project.status === "COMPLETED"
                        ? "完了"
                        : project.status === "PLANNING"
                        ? "計画中"
                        : project.status === "ON_HOLD"
                        ? "保留"
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

        {/* 関連機器一覧 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              関連機器 ({company._count?.equipment ?? company.equipment.length})
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
            <p className="text-sm text-gray-500">関連機器が登録されていません</p>
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
        </>
      ) : (
        <HistoryTab entityType="Company" entityId={company.id} />
      )}

      {/* 連絡先新規作成モーダル */}
      {isContactModalOpen && (
        <ContactCreateModal
          title="連絡先を新規作成"
          companyId={company.id}
          onClose={handleContactCreateCancel}
          onSuccess={handleContactCreateSuccess}
        />
      )}

      {/* 営業案件新規作成モーダル */}
      {isSalesOpportunityModalOpen && (
        <SalesOpportunityCreateModal
          title="営業案件を新規作成"
          companyId={company.id}
          onClose={handleSalesOpportunityCreateCancel}
          onSuccess={handleSalesOpportunityCreateSuccess}
        />
      )}

      {/* プロジェクト新規作成モーダル */}
      {isProjectModalOpen && (
        <ProjectCreateModal
          title="プロジェクトを新規作成"
          companyId={company.id}
          onClose={handleProjectCreateCancel}
          onSuccess={handleProjectCreateSuccess}
        />
      )}
    </div>
  );
}

/**
 * 連絡先新規作成モーダルコンポーネント
 */
interface ContactCreateModalProps {
  title: string;
  companyId: string;
  onClose: () => void;
  onSuccess: (contact: any) => void;
}

function ContactCreateModal({
  title,
  companyId,
  onClose,
  onSuccess,
}: ContactCreateModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span className="sr-only">閉じる</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-4">
            <ContactCreateFormWithCompanyId
              companyId={companyId}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 取引先IDが事前に設定された連絡先作成フォーム
 */
interface ContactCreateFormWithCompanyIdProps {
  companyId: string;
  onSuccess: (contact: any) => void;
  onCancel: () => void;
}

function ContactCreateFormWithCompanyId({
  companyId,
  onSuccess,
  onCancel,
}: ContactCreateFormWithCompanyIdProps) {
  return (
    <ContactCreateForm
      onSuccess={onSuccess}
      onCancel={onCancel}
      defaultCompanyId={companyId}
    />
  );
}

/**
 * 営業案件新規作成モーダルコンポーネント
 */
interface SalesOpportunityCreateModalProps {
  title: string;
  companyId: string;
  onClose: () => void;
  onSuccess: (salesOpportunity: any) => void;
}

function SalesOpportunityCreateModal({
  title,
  companyId,
  onClose,
  onSuccess,
}: SalesOpportunityCreateModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span className="sr-only">閉じる</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-4">
            <SalesOpportunityCreateFormWithCompanyId
              companyId={companyId}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 取引先IDが事前に設定された営業案件作成フォーム
 */
interface SalesOpportunityCreateFormWithCompanyIdProps {
  companyId: string;
  onSuccess: (salesOpportunity: any) => void;
  onCancel: () => void;
}

function SalesOpportunityCreateFormWithCompanyId({
  companyId,
  onSuccess,
  onCancel,
}: SalesOpportunityCreateFormWithCompanyIdProps) {
  return (
    <SalesOpportunityCreateForm
      onSuccess={onSuccess}
      onCancel={onCancel}
      defaultCompanyId={companyId}
    />
  );
}

/**
 * プロジェクト新規作成モーダルコンポーネント
 */
interface ProjectCreateModalProps {
  title: string;
  companyId: string;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

function ProjectCreateModal({
  title,
  companyId,
  onClose,
  onSuccess,
}: ProjectCreateModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span className="sr-only">閉じる</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-4">
            <ProjectCreateFormWithCompanyId
              companyId={companyId}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 取引先IDが事前に設定されたプロジェクト作成フォーム
 */
interface ProjectCreateFormWithCompanyIdProps {
  companyId: string;
  onSuccess: (projectId: string) => void;
  onCancel: () => void;
}

function ProjectCreateFormWithCompanyId({
  companyId,
  onSuccess,
  onCancel,
}: ProjectCreateFormWithCompanyIdProps) {
  const handleSuccess = (projectId: string) => {
    onSuccess(projectId);
  };

  return (
    <ProjectCreateForm
      onSuccess={handleSuccess}
      onCancel={onCancel}
      defaultCompanyId={companyId}
    />
  );
}

