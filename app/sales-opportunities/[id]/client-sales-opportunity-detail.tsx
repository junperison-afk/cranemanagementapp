"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";

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
  contract: any | null;
  project: {
    id: string;
    title: string;
    status: string;
  } | null;
  _count: {
    quotes: number;
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
  const [salesOpportunity, setSalesOpportunity] =
    useState(initialSalesOpportunity);
  const [isSaving, setIsSaving] = useState(false);

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
      // 既存の関連データを保持
      setSalesOpportunity({
        ...updated,
        quotes: salesOpportunity.quotes,
        contract: salesOpportunity.contract,
        project: salesOpportunity.project,
        _count: salesOpportunity._count,
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
            <h1 className="text-2xl font-bold text-gray-900">
              {salesOpportunity.title}
            </h1>
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
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              statusColors[salesOpportunity.status]
            }`}
          >
            {statusLabels[salesOpportunity.status]}
          </span>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            type="text"
            placeholder="YYYY-MM-DD"
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
              見積 ({salesOpportunity._count.quotes})
            </h2>
            {canEdit && (
              <Link
                href={`/sales-opportunities/${salesOpportunity.id}/quotes/new`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                新規作成
              </Link>
            )}
          </div>
          {salesOpportunity.quotes.length === 0 ? (
            <p className="text-sm text-gray-500">見積がありません</p>
          ) : (
            <div className="space-y-2">
              {salesOpportunity.quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="border-b border-gray-200 pb-2 last:border-0 last:pb-0"
                >
                  <Link
                    href={`/sales-opportunities/${salesOpportunity.id}/quotes/${quote.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {quote.quoteNumber} - ¥
                    {quote.amount.toLocaleString()}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 契約・プロジェクト情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            契約・プロジェクト
          </h2>
          {salesOpportunity.contract ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">契約番号</p>
                <p className="text-sm text-gray-900">
                  {salesOpportunity.contract.contractNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">契約日</p>
                <p className="text-sm text-gray-900">
                  {new Date(
                    salesOpportunity.contract.contractDate
                  ).toLocaleDateString("ja-JP")}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">契約情報がありません</p>
          )}
          {salesOpportunity.project && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href={`/projects/${salesOpportunity.project.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                プロジェクト: {salesOpportunity.project.title}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

