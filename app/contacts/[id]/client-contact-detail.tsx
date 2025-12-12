"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import CompanySelectModal from "@/components/contacts/company-select-modal";
import CompanyDetailModal from "@/components/contacts/company-detail-modal";
import HistoryTab from "@/components/common/history-tab";

interface Contact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
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
}

interface ClientContactDetailProps {
  contact: Contact;
  canEdit: boolean;
}

export default function ClientContactDetail({
  contact: initialContact,
  canEdit,
}: ClientContactDetailProps) {
  const router = useRouter();

  // データが読み込まれたことを通知
  useEffect(() => {
    const event = new CustomEvent("page:content:loaded");
    window.dispatchEvent(event);
  }, [initialContact]);
  const { data: session } = useSession();
  const [contact, setContact] = useState(initialContact);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isCompanySelectModalOpen, setIsCompanySelectModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const updateContact = async (field: string, value: any) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
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
      setContact(updated);
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
    await updateContact(field, value);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/contacts"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              <Link
                href={`/companies/${contact.company.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {contact.company.name}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session?.user.role === "ADMIN" && (
            <DeleteItemButton
              apiPath="/api/contacts"
              itemId={contact.id}
              resourceName="連絡先"
              redirectPath="/contacts"
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
            label="氏名"
            value={contact.name}
            onSave={(value) => handleSave("name", value)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="役職"
            value={contact.position || ""}
            onSave={(value) => handleSave("position", value || null)}
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="電話番号"
            value={contact.phone || ""}
            onSave={(value) => handleSave("phone", value || null)}
            type="tel"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <InlineEditField
            label="メール"
            value={contact.email || ""}
            onSave={(value) => handleSave("email", value || null)}
            type="email"
            className={canEdit ? "" : "pointer-events-none opacity-60"}
          />
          <div className="md:col-span-2">
            <InlineEditField
              label="対応履歴メモ"
              value={contact.notes || ""}
              onSave={(value) => handleSave("notes", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
        </div>
      </div>

      {/* 関連取引先 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            関連取引先 (1)
          </h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsCompanySelectModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + 追加
            </button>
          )}
        </div>
        {contact.company ? (
          <button
            onClick={() => setSelectedCompanyId(contact.company.id)}
            className="block w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
          >
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-gray-500">会社名</p>
                <p className="text-gray-900 mt-1 font-medium">
                  {contact.company.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">郵便番号</p>
                <p className="text-gray-900 mt-1">
                  {contact.company.postalCode ? `〒${contact.company.postalCode}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">住所</p>
                <p className="text-gray-900 mt-1">
                  {contact.company.address || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">電話</p>
                <p className="text-gray-900 mt-1">
                  {contact.company.phone || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">メール</p>
                <p className="text-gray-900 mt-1">
                  {contact.company.email || "-"}
                </p>
              </div>
            </div>
          </button>
        ) : (
          <p className="text-sm text-gray-500">関連取引先がありません</p>
        )}
      </div>
        </>
      ) : (
        <HistoryTab entityType="Contact" entityId={contact.id} />
      )}

      {/* 取引先選択モーダル */}
      <CompanySelectModal
        isOpen={isCompanySelectModalOpen}
        onClose={() => setIsCompanySelectModalOpen(false)}
        currentContactId={contact.id}
        onSelect={async (companyId) => {
          try {
            const response = await fetch(`/api/contacts/${contact.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                companyId: companyId,
              }),
            });

            if (!response.ok) {
              throw new Error("取引先の関連付けに失敗しました");
            }

            const updated = await response.json();
            setContact(updated);
          } catch (error) {
            console.error("取引先関連付けエラー:", error);
            alert("取引先の関連付けに失敗しました");
            throw error;
          }
        }}
      />

      {/* 取引先詳細モーダル */}
      {selectedCompanyId && (
        <CompanyDetailModal
          isOpen={!!selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
          companyId={selectedCompanyId}
          canEdit={canEdit}
          onUnlink={async () => {
            // 連絡先の取引先をnullにする
            try {
              const response = await fetch(`/api/contacts/${contact.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  companyId: null,
                }),
              });

              if (!response.ok) {
                throw new Error("取引先の関連外しに失敗しました");
              }

              const updated = await response.json();
              setContact(updated);
            } catch (error) {
              console.error("取引先関連外しエラー:", error);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}

