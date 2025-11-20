import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import CompaniesPageContent from "@/components/companies/companies-page-content";
import TableSkeleton from "@/components/common/table-skeleton";
import {
  CompanyFilterButtonWrapper,
  CompanyFilterPanelWrapper,
} from "@/components/companies/company-filters-wrapper";
import CreateButton from "@/components/common/create-button";
import CompanyCreateForm from "@/components/companies/company-create-form";
import DeleteButton from "@/components/common/delete-button";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    postalCode?: string;
    address?: string;
    phone?: string;
    email?: string;
    industryType?: string;
    billingFlag?: string;
    hasSalesOpportunities?: string;
    hasProjects?: string;
    hasEquipment?: string;
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
            <h1 className="text-2xl font-bold text-gray-900">取引先一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              取引先の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DeleteButton
              eventName="companySelectionChange"
              apiPath="/api/companies"
              resourceName="取引先"
            />
            <CompanyFilterButtonWrapper />
            <CreateButton
              title="取引先を新規作成"
              formComponent={CompanyCreateForm}
              resourcePath="companies"
            />
          </div>
        </div>

        {/* データテーブル部分 */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div>
            <CompanyFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <TableSkeleton rowCount={10} columnCount={8} />
              }
            >
              <CompaniesPageContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
