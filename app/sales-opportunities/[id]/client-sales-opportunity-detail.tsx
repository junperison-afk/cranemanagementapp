"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";
import InlineEditLookup from "@/components/companies/inline-edit-lookup";
import CompanyCreateForm from "@/components/companies/company-create-form";
import QuoteCreateModal from "@/components/sales-opportunities/quote-create-modal";
import QuoteDetailModal from "@/components/sales-opportunities/quote-detail-modal";
import ContractCreateModal from "@/components/sales-opportunities/contract-create-modal";
import ContractDetailModal from "@/components/sales-opportunities/contract-detail-modal";
import ProjectCreateModal from "@/components/projects/project-create-modal";
import ProjectSelectModal from "@/components/sales-opportunities/project-select-modal";
import HistoryTab from "@/components/common/history-tab";

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
  quotes: any[];
  contracts: any[];
  project: {
    id: string;
    title: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    amount: number | null;
    assignedUser: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  } | null;
  _count: {
    quotes: number;
    contracts: number;
  };
}

interface ClientSalesOpportunityDetailProps {
  salesOpportunity: SalesOpportunity;
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

export default function ClientSalesOpportunityDetail({
  salesOpportunity: initialSalesOpportunity,
  canEdit,
}: ClientSalesOpportunityDetailProps) {
  const router = useRouter();

  // データが読み込まれたことを通知
  useEffect(() => {
    const event = new CustomEvent("page:content:loaded");
    window.dispatchEvent(event);
  }, [initialSalesOpportunity]);
  const { data: session } = useSession();
  const [salesOpportunity, setSalesOpportunity] =
    useState(initialSalesOpportunity);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isQuoteCreateModalOpen, setIsQuoteCreateModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isContractCreateModalOpen, setIsContractCreateModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);
  const [isProjectSelectModalOpen, setIsProjectSelectModalOpen] = useState(false);

  const updateSalesOpportunity = async (field: string, value: any) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/sales-opportunities/${salesOpportunity.id}`,
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
      // 既存の関連データを保持して即座に更新（router.refreshは不要）
      setSalesOpportunity({
        ...updated,
        quotes: salesOpportunity.quotes,
        contracts: salesOpportunity.contracts,
        project: salesOpportunity.project,
        _count: salesOpportunity._count,
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
    await updateSalesOpportunity(field, value);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/sales-opportunities"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {salesOpportunity.title}
              </h1>
              <span
                className={`inline-flex px-3 py-0.5 text-sm font-semibold rounded-full ${
                  statusColors[salesOpportunity.status]
                }`}
              >
                {statusLabels[salesOpportunity.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              <Link
                href={`/companies/${salesOpportunity.company.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {salesOpportunity.company.name}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session?.user.role === "ADMIN" && (
            <DeleteItemButton
              apiPath="/api/sales-opportunities"
              itemId={salesOpportunity.id}
              resourceName="営業案件"
              redirectPath="/sales-opportunities"
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
          <InlineEditLookup
            label="関連取引先"
            value={salesOpportunity.company.id}
            onSave={(value) => handleSave("companyId", value)}
            apiEndpoint="/api/companies"
            displayKey="name"
            secondaryKey="address"
            itemsKey="companies"
            placeholder="例: 株式会社○○工業"
            createNewUrl="/companies/new"
            returnUrl={`/sales-opportunities/${salesOpportunity.id}`}
            canEdit={canEdit}
            createFormComponent={CompanyCreateForm}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="案件タイトル"
            value={salesOpportunity.title}
            onSave={(value) => handleSave("title", value)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditSelect
            label="ステータス"
            value={salesOpportunity.status}
            onSave={(value) => handleSave("status", value)}
            options={statusOptions}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="想定金額"
            value={
              salesOpportunity.estimatedAmount
                ? String(salesOpportunity.estimatedAmount)
                : ""
            }
            onSave={(value) =>
              handleSave("estimatedAmount", value ? value : null)
            }
            type="text"
            placeholder="例: 1000000"
            formatNumber={true}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="クレーン台数"
            value={
              salesOpportunity.craneCount
                ? String(salesOpportunity.craneCount)
                : ""
            }
            onSave={(value) =>
              handleSave("craneCount", value ? parseInt(value) : null)
            }
            type="text"
            placeholder="例: 5"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="クレーン情報"
            value={salesOpportunity.craneInfo || ""}
            onSave={(value) => handleSave("craneInfo", value || null)}
            multiline
            placeholder="型式・概要など"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="発生日"
            value={
              salesOpportunity.occurredAt
                ? new Date(salesOpportunity.occurredAt)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onSave={(value) =>
              handleSave("occurredAt", value ? new Date(value).toISOString() : null)
            }
            type="date"
            placeholder="日付を選択"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <div className="md:col-span-2">
            <InlineEditField
              label="備考"
              value={salesOpportunity.notes || ""}
              onSave={(value) => handleSave("notes", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
        </div>
      </div>

      {/* 関連情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 見積情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              見積書 ({salesOpportunity._count.quotes})
            </h2>
            {canEdit && (
              <button
                onClick={() => setIsQuoteCreateModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                見積作成
              </button>
            )}
          </div>
          {salesOpportunity.quotes.length === 0 ? (
            <p className="text-sm text-gray-500">見積がありません</p>
          ) : (
            <div className="space-y-3">
              {salesOpportunity.quotes.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() => setSelectedQuoteId(quote.id)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">作成日</p>
                      <p className="text-gray-900 mt-1">
                        {new Date(quote.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">見積番号</p>
                      <p className="text-gray-900 mt-1">
                        {quote.quoteNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">金額</p>
                      <p className="text-gray-900 mt-1">
                        ¥{quote.amount.toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">ステータス</p>
                      <p className="text-gray-900 mt-1">
                        {quote.status === "DRAFT" && "下書き"}
                        {quote.status === "SENT" && "送信済み"}
                        {quote.status === "ACCEPTED" && "承認済み"}
                        {quote.status === "REJECTED" && "却下"}
                        {!["DRAFT", "SENT", "ACCEPTED", "REJECTED"].includes(quote.status) && quote.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 受注書情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              受注書 ({salesOpportunity._count?.contracts ?? salesOpportunity.contracts?.length ?? 0})
            </h2>
            {canEdit && (
              <button
                onClick={() => setIsContractCreateModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                受注書作成
              </button>
            )}
          </div>
          {salesOpportunity.contracts.length === 0 ? (
            <p className="text-sm text-gray-500">受注書情報がありません</p>
          ) : (
            <div className="space-y-3">
              {salesOpportunity.contracts.map((contract) => (
                <button
                  key={contract.id}
                  onClick={() => setSelectedContractId(contract.id)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">契約日</p>
                      <p className="text-gray-900 mt-1">
                        {new Date(contract.contractDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">契約番号</p>
                      <p className="text-gray-900 mt-1">
                        {contract.contractNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">金額</p>
                      <p className="text-gray-900 mt-1">
                        {contract.amount
                          ? `¥${contract.amount.toLocaleString("ja-JP")}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">ステータス</p>
                      <p className="text-gray-900 mt-1">
                        {contract.status === "DRAFT" && "下書き"}
                        {contract.status === "CONFIRMED" && "確定"}
                        {contract.status === "CANCELLED" && "キャンセル"}
                        {!["DRAFT", "CONFIRMED", "CANCELLED"].includes(contract.status) && (contract.status || "-")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 関連プロジェクト情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            関連プロジェクト ({salesOpportunity.project ? 1 : 0})
          </h2>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProjectCreateModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                この営業案件からプロジェクト作成
              </button>
              <button
                onClick={() => setIsProjectSelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                既存プロジェクトを関連付け
              </button>
            </div>
          )}
        </div>
        {salesOpportunity.project ? (
          <Link
            href={`/projects/${salesOpportunity.project.id}`}
            className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
          >
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">開始日</p>
                <p className="text-gray-900 mt-1">
                  {salesOpportunity.project.startDate
                    ? new Date(
                        salesOpportunity.project.startDate
                      ).toLocaleDateString("ja-JP")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">終了日</p>
                <p className="text-gray-900 mt-1">
                  {salesOpportunity.project.endDate
                    ? new Date(
                        salesOpportunity.project.endDate
                      ).toLocaleDateString("ja-JP")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">金額</p>
                <p className="text-gray-900 mt-1">
                  {salesOpportunity.project.amount
                    ? `¥${salesOpportunity.project.amount.toLocaleString("ja-JP")}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">ステータス</p>
                <p className="text-gray-900 mt-1">
                  {salesOpportunity.project.status === "PLANNING"
                    ? "計画中"
                    : salesOpportunity.project.status === "IN_PROGRESS"
                    ? "進行中"
                    : salesOpportunity.project.status === "ON_HOLD"
                    ? "保留"
                    : salesOpportunity.project.status === "COMPLETED"
                    ? "完了"
                    : salesOpportunity.project.status}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <p className="text-sm text-gray-500">関連プロジェクトがありません</p>
        )}
      </div>
        </>
      ) : (
        <HistoryTab entityType="SalesOpportunity" entityId={salesOpportunity.id} />
      )}

      {/* 見積作成モーダル */}
      <QuoteCreateModal
        isOpen={isQuoteCreateModalOpen}
        onClose={() => setIsQuoteCreateModalOpen(false)}
        salesOpportunityId={salesOpportunity.id}
        onSuccess={async () => {
          // 見積作成後、営業案件データを再取得して即座に反映
          try {
            const response = await fetch(
              `/api/sales-opportunities/${salesOpportunity.id}`
            );
            if (response.ok) {
              const updatedSalesOpportunity = await response.json();
              setSalesOpportunity({
                ...updatedSalesOpportunity,
                // 既存の関連データを保持
                contracts: salesOpportunity.contracts,
                project: salesOpportunity.project,
              });
            }
          } catch (error) {
            console.error("データ再取得エラー:", error);
            // エラー時はページをリフレッシュ
            router.refresh();
          }
        }}
      />

      {/* 見積詳細モーダル */}
      {selectedQuoteId && (
        <QuoteDetailModal
          isOpen={!!selectedQuoteId}
          onClose={() => setSelectedQuoteId(null)}
          salesOpportunityId={salesOpportunity.id}
          quoteId={selectedQuoteId}
          onSuccess={async () => {
            // 見積更新後、営業案件データを再取得して即座に反映
            try {
              const response = await fetch(
                `/api/sales-opportunities/${salesOpportunity.id}`
              );
              if (response.ok) {
                const updatedSalesOpportunity = await response.json();
                setSalesOpportunity({
                  ...updatedSalesOpportunity,
                  // 既存の関連データを保持
                  contracts: salesOpportunity.contracts,
                  project: salesOpportunity.project,
                });
              }
            } catch (error) {
              console.error("データ再取得エラー:", error);
              router.refresh();
            }
          }}
        />
      )}

      {/* 受注書作成モーダル */}
      <ContractCreateModal
        isOpen={isContractCreateModalOpen}
        onClose={() => setIsContractCreateModalOpen(false)}
        salesOpportunityId={salesOpportunity.id}
        quotes={salesOpportunity.quotes}
        onSuccess={async () => {
          // 受注書作成後、営業案件データを再取得して即座に反映
          try {
            const response = await fetch(
              `/api/sales-opportunities/${salesOpportunity.id}`
            );
            if (response.ok) {
              const updatedSalesOpportunity = await response.json();
              setSalesOpportunity({
                ...updatedSalesOpportunity,
                // 既存の関連データを保持
                quotes: salesOpportunity.quotes,
              });
            }
          } catch (error) {
            console.error("データ再取得エラー:", error);
            router.refresh();
          }
        }}
      />

      {/* 受注書詳細モーダル */}
      {selectedContractId && (
        <ContractDetailModal
          isOpen={!!selectedContractId}
          onClose={() => setSelectedContractId(null)}
          salesOpportunityId={salesOpportunity.id}
          contractId={selectedContractId}
          onSuccess={async () => {
            // 受注書更新後、営業案件データを再取得して即座に反映
            try {
              const response = await fetch(
                `/api/sales-opportunities/${salesOpportunity.id}`
              );
              if (response.ok) {
                const updatedSalesOpportunity = await response.json();
                setSalesOpportunity({
                  ...updatedSalesOpportunity,
                  // 既存の関連データを保持
                  quotes: salesOpportunity.quotes,
                  project: salesOpportunity.project,
                });
              }
            } catch (error) {
              console.error("データ再取得エラー:", error);
              router.refresh();
            }
          }}
        />
      )}

      {/* プロジェクト作成モーダル */}
      <ProjectCreateModal
        isOpen={isProjectCreateModalOpen}
        onClose={() => setIsProjectCreateModalOpen(false)}
        defaultCompanyId={salesOpportunity.company.id}
        defaultSalesOpportunityId={salesOpportunity.id}
        onSuccess={async () => {
          // プロジェクト作成後、営業案件データを再取得して即座に反映
          try {
            const response = await fetch(
              `/api/sales-opportunities/${salesOpportunity.id}`
            );
            if (response.ok) {
              const updatedSalesOpportunity = await response.json();
              setSalesOpportunity({
                ...updatedSalesOpportunity,
                // 既存の関連データを保持
                quotes: salesOpportunity.quotes,
              });
            }
          } catch (error) {
            console.error("データ再取得エラー:", error);
            router.refresh();
          }
        }}
      />

      {/* プロジェクト選択モーダル */}
      <ProjectSelectModal
        isOpen={isProjectSelectModalOpen}
        onClose={() => setIsProjectSelectModalOpen(false)}
        companyId={salesOpportunity.company.id}
        currentSalesOpportunityId={salesOpportunity.id}
        onSelect={async (projectId: string) => {
          // プロジェクトのsalesOpportunityIdを更新
          try {
            const response = await fetch(`/api/projects/${projectId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                salesOpportunityId: salesOpportunity.id,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "プロジェクトの関連付けに失敗しました");
            }

            // 営業案件データを再取得して即座に反映
            const salesOpportunityResponse = await fetch(
              `/api/sales-opportunities/${salesOpportunity.id}`
            );
            if (salesOpportunityResponse.ok) {
              const updatedSalesOpportunity = await salesOpportunityResponse.json();
              setSalesOpportunity({
                ...updatedSalesOpportunity,
                // 既存の関連データを保持
                quotes: salesOpportunity.quotes,
              });
            } else {
              router.refresh();
            }
          } catch (error) {
            console.error("プロジェクト関連付けエラー:", error);
            throw error;
          }
        }}
      />
    </div>
  );
}

