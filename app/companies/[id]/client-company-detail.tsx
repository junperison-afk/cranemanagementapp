"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";
import ContactSelectModal from "@/components/projects/contact-select-modal";
import ContactDetailModal from "@/components/projects/contact-detail-modal";
import SalesOpportunitySelectModal from "@/components/projects/sales-opportunity-select-modal";
import SalesOpportunityDetailModal from "@/components/projects/sales-opportunity-detail-modal";
import ProjectSelectModal from "@/components/companies/project-select-modal";
import ProjectDetailModal from "@/components/companies/project-detail-modal";
import EquipmentDetailModal from "@/components/projects/equipment-detail-modal";
import CompanyTimeline from "@/components/companies/company-timeline";
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
  createdAt: Date;
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

  // データが読み込まれたことを通知
  useEffect(() => {
    const event = new CustomEvent("page:content:loaded");
    window.dispatchEvent(event);
  }, [initialCompany]);
  const { data: session } = useSession();
  const [company, setCompany] = useState(initialCompany);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isContactSelectModalOpen, setIsContactSelectModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isSalesOpportunitySelectModalOpen, setIsSalesOpportunitySelectModalOpen] = useState(false);
  const [selectedSalesOpportunityId, setSelectedSalesOpportunityId] = useState<string | null>(null);
  const [isProjectSelectModalOpen, setIsProjectSelectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

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

  // 連絡先を関連付ける
  const handleContactSelect = async (contactId: string) => {
    // 連絡先は既にcompanyIdで関連付けられているため、追加の処理は不要
    // データを再取得して反映
    const companyResponse = await fetch(`/api/companies/${company.id}`);
    if (companyResponse.ok) {
      const updatedCompany = await companyResponse.json();
      setCompany(updatedCompany);
    } else {
      router.refresh();
    }
  };

  // 営業案件を関連付ける
  const handleSalesOpportunitySelect = async (salesOpportunityId: string) => {
    // 営業案件は既にcompanyIdで関連付けられているため、追加の処理は不要
    // データを再取得して反映
    const companyResponse = await fetch(`/api/companies/${company.id}`);
    if (companyResponse.ok) {
      const updatedCompany = await companyResponse.json();
      setCompany(updatedCompany);
    } else {
      router.refresh();
    }
  };

  // プロジェクトを関連付ける
  const handleProjectSelect = async (projectId: string) => {
    // プロジェクトは既にcompanyIdで関連付けられているため、追加の処理は不要
    // データを再取得して反映
    const companyResponse = await fetch(`/api/companies/${company.id}`);
    if (companyResponse.ok) {
      const updatedCompany = await companyResponse.json();
      setCompany(updatedCompany);
    } else {
      router.refresh();
    }
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
          {/* タイムライン */}
          <CompanyTimeline
            companyCreatedAt={company.createdAt}
            salesOpportunities={company.salesOpportunities.map((so) => ({
              id: so.id,
              title: so.title,
              createdAt: so.createdAt,
            }))}
            projects={company.projects.map((project) => ({
              id: project.id,
              title: project.title,
              startDate: project.startDate,
              endDate: project.endDate,
            }))}
          />

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
                onClick={() => setIsContactSelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">氏名</p>
                      <p className="text-gray-900 mt-1 font-medium">
                        {contact.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">役職</p>
                      <p className="text-gray-900 mt-1">
                        {contact.position || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">電話</p>
                      <p className="text-gray-900 mt-1">
                        {contact.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">メール</p>
                      <p className="text-gray-900 mt-1">
                        {contact.email || "-"}
                      </p>
                    </div>
                  </div>
                </button>
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
                onClick={() => setIsSalesOpportunitySelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                <button
                  key={opportunity.id}
                  onClick={() => setSelectedSalesOpportunityId(opportunity.id)}
                  className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">発生日</p>
                      <p className="text-gray-900 mt-1">
                        {opportunity.occurredAt
                          ? new Date(opportunity.occurredAt).toLocaleDateString("ja-JP")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">見積金額</p>
                      <p className="text-gray-900 mt-1">
                        {opportunity.estimatedAmount
                          ? `¥${opportunity.estimatedAmount.toLocaleString("ja-JP")}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">ステータス</p>
                      <p className="text-gray-900 mt-1">
                        {opportunity.status === "ESTIMATING"
                          ? "見積中"
                          : opportunity.status === "WON"
                          ? "受注"
                          : opportunity.status === "LOST"
                          ? "失注"
                          : opportunity.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">案件タイトル</p>
                      <p className="text-gray-900 mt-1 font-medium">
                        {opportunity.title}
                      </p>
                    </div>
                  </div>
                </button>
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
                onClick={() => setIsProjectSelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">開始日</p>
                      <p className="text-gray-900 mt-1">
                        {project.startDate
                          ? new Date(project.startDate).toLocaleDateString("ja-JP")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">終了日</p>
                      <p className="text-gray-900 mt-1">
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString("ja-JP")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">金額</p>
                      <p className="text-gray-900 mt-1">
                        {project.amount
                          ? `¥${project.amount.toLocaleString("ja-JP")}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">ステータス</p>
                      <p className="text-gray-900 mt-1 font-medium">
                        {project.status === "IN_PROGRESS"
                          ? "進行中"
                          : project.status === "COMPLETED"
                          ? "完了"
                          : project.status === "PLANNING"
                          ? "計画中"
                          : project.status === "ON_HOLD"
                          ? "保留"
                          : project.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-500 text-sm">プロジェクトタイトル</p>
                    <p className="text-gray-900 mt-1 font-medium">
                      {project.title}
                    </p>
                  </div>
                </button>
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
              <button
                onClick={() => {
                  // 機器追加モーダルを開く（今後実装予定）
                  router.push(`/equipment/new?companyId=${company.id}`);
                }}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </button>
            )}
          </div>
          {company.equipment.length === 0 ? (
            <p className="text-sm text-gray-500">関連機器が登録されていません</p>
          ) : (
            <div className="space-y-3">
              {company.equipment.map((equipment) => (
                <button
                  key={equipment.id}
                  onClick={() => setSelectedEquipmentId(equipment.id)}
                  className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">機器名</p>
                      <p className="text-gray-900 mt-1 font-medium">
                        {equipment.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">機種</p>
                      <p className="text-gray-900 mt-1">
                        {equipment.model || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">製造番号</p>
                      <p className="text-gray-900 mt-1">
                        {equipment.serialNumber || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">設置場所</p>
                      <p className="text-gray-900 mt-1">
                        {equipment.location || "-"}
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
        <HistoryTab entityType="Company" entityId={company.id} />
      )}

      {/* 連絡先選択モーダル */}
      <ContactSelectModal
        isOpen={isContactSelectModalOpen}
        onClose={() => setIsContactSelectModalOpen(false)}
        companyId={company.id}
        onSelect={handleContactSelect}
      />

      {/* 連絡先詳細モーダル */}
      {selectedContactId && (
        <ContactDetailModal
          isOpen={!!selectedContactId}
          onClose={() => setSelectedContactId(null)}
          contactId={selectedContactId}
          canEdit={canEdit}
          onUnlink={async () => {
            // 取引先詳細画面では、連絡先を削除する
            try {
              const response = await fetch(`/api/contacts/${selectedContactId}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("連絡先の削除に失敗しました");
              }

              // 取引先データを再取得
              const companyResponse = await fetch(`/api/companies/${company.id}`);
              if (companyResponse.ok) {
                const updatedCompany = await companyResponse.json();
                setCompany(updatedCompany);
              } else {
                router.refresh();
              }
            } catch (error) {
              console.error("連絡先削除エラー:", error);
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
            // 取引先詳細画面では、営業案件のcompanyIdを変更する（削除ではなく）
            // ただし、営業案件は必ず取引先に紐付いているため、関連から外す操作は実質的に削除になる
            try {
              const response = await fetch(`/api/sales-opportunities/${selectedSalesOpportunityId}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("営業案件の削除に失敗しました");
              }

              // 取引先データを再取得
              const companyResponse = await fetch(`/api/companies/${company.id}`);
              if (companyResponse.ok) {
                const updatedCompany = await companyResponse.json();
                setCompany(updatedCompany);
              } else {
                router.refresh();
              }
            } catch (error) {
              console.error("営業案件削除エラー:", error);
              throw error;
            }
          }}
        />
      )}

      {/* プロジェクト詳細モーダル */}
      {selectedProjectId && (
        <ProjectDetailModal
          isOpen={!!selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          projectId={selectedProjectId}
          canEdit={canEdit}
          onUnlink={async () => {
            // 取引先詳細画面では、プロジェクトのcompanyIdを変更する（削除ではなく）
            // ただし、プロジェクトは必ず取引先に紐付いているため、関連から外す操作は実質的に削除になる
            try {
              const response = await fetch(`/api/projects/${selectedProjectId}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("プロジェクトの削除に失敗しました");
              }

              // 取引先データを再取得
              const companyResponse = await fetch(`/api/companies/${company.id}`);
              if (companyResponse.ok) {
                const updatedCompany = await companyResponse.json();
                setCompany(updatedCompany);
              } else {
                router.refresh();
              }
            } catch (error) {
              console.error("プロジェクト削除エラー:", error);
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
            // 取引先詳細画面では、機器のcompanyIdを変更する（削除ではなく）
            try {
              const response = await fetch(`/api/equipment/${selectedEquipmentId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  companyId: null,
                }),
              });

              if (!response.ok) {
                throw new Error("機器の関連外しに失敗しました");
              }

              // 取引先データを再取得
              const companyResponse = await fetch(`/api/companies/${company.id}`);
              if (companyResponse.ok) {
                const updatedCompany = await companyResponse.json();
                setCompany(updatedCompany);
              } else {
                router.refresh();
              }
            } catch (error) {
              console.error("機器関連外しエラー:", error);
              throw error;
            }
          }}
        />
      )}

      {/* 営業案件選択モーダル */}
      <SalesOpportunitySelectModal
        isOpen={isSalesOpportunitySelectModalOpen}
        onClose={() => setIsSalesOpportunitySelectModalOpen(false)}
        companyId={company.id}
        currentProjectId={""} // 取引先詳細画面ではプロジェクトIDは不要
        onSelect={handleSalesOpportunitySelect}
      />

      {/* プロジェクト選択モーダル */}
      <ProjectSelectModal
        isOpen={isProjectSelectModalOpen}
        onClose={() => setIsProjectSelectModalOpen(false)}
        companyId={company.id}
        onSelect={handleProjectSelect}
      />
    </div>
  );
}


