"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import InlineEditField from "@/components/companies/inline-edit-field";

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
  const [contact, setContact] = useState(initialContact);
  const [isSaving, setIsSaving] = useState(false);

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
      </div>

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

      {/* 関連情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">関連取引先情報</h2>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-500">会社名</p>
            <Link
              href={`/companies/${contact.company.id}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {contact.company.name}
            </Link>
          </div>
          {contact.company.postalCode && (
            <div>
              <p className="text-sm text-gray-500">郵便番号</p>
              <p className="text-sm text-gray-900">
                〒{contact.company.postalCode}
              </p>
            </div>
          )}
          {contact.company.address && (
            <div>
              <p className="text-sm text-gray-500">住所</p>
              <p className="text-sm text-gray-900">{contact.company.address}</p>
            </div>
          )}
          {contact.company.phone && (
            <div>
              <p className="text-sm text-gray-500">電話番号</p>
              <p className="text-sm text-gray-900">{contact.company.phone}</p>
            </div>
          )}
          {contact.company.email && (
            <div>
              <p className="text-sm text-gray-500">メール</p>
              <p className="text-sm text-gray-900">{contact.company.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

