"use client";

import {
  ContactFilterButtonWrapper,
  ContactFilterPanelWrapper,
} from "@/components/contacts/contact-filters-wrapper";
import ContactTableWrapper from "@/components/contacts/contact-table-wrapper";
import CreateButton from "@/components/common/create-button";
import ContactCreateForm from "@/components/contacts/contact-create-form";
import DeleteButton from "@/components/common/delete-button";

interface Contact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
}

interface ContactsPageClientProps {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function ContactsPageClient({
  contacts,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: ContactsPageClientProps) {
  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">連絡先一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            連絡先の検索・管理ができます
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteButton
            eventName="contactSelectionChange"
            apiPath="/api/contacts"
            resourceName="連絡先"
          />
          <ContactFilterButtonWrapper />
          <CreateButton
            title="連絡先を新規作成"
            formComponent={ContactCreateForm}
            resourcePath="contacts"
          />
        </div>
      </div>

      {/* データテーブル部分（2分割可能） */}
      <div className="flex-1 flex gap-0 min-h-0 h-full">
        {/* フィルターパネル */}
        <div>
          <ContactFilterPanelWrapper />
        </div>

        {/* データテーブル */}
        <div className="flex-1 min-w-0">
          <ContactTableWrapper
            contacts={contacts}
            total={total}
            page={page}
            limit={limit}
            skip={skip}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        </div>
      </div>
    </div>
  );
}

