import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import ContactsPageContent from "@/components/contacts/contacts-page-content";
import TableSkeleton from "@/components/common/table-skeleton";
import {
  ContactFilterButtonWrapper,
  ContactFilterPanelWrapper,
} from "@/components/contacts/contact-filters-wrapper";
import CreateButton from "@/components/common/create-button";
import ContactCreateForm from "@/components/contacts/contact-create-form";
import DeleteButton from "@/components/common/delete-button";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    companyId?: string;
    position?: string;
    phone?: string;
    email?: string;
    updatedAfter?: string;
    updatedBefore?: string;
  };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <MainLayout>
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

        {/* データテーブル部分 */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div>
            <ContactFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <TableSkeleton rowCount={10} columnCount={7} />
              }
            >
              <ContactsPageContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

