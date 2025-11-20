import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import SalesOpportunitiesPageContent from "@/components/sales-opportunities/sales-opportunities-page-content";
import TableSkeleton from "@/components/common/table-skeleton";
import {
  SalesOpportunityFilterButtonWrapper,
  SalesOpportunityFilterPanelWrapper,
} from "@/components/sales-opportunities/sales-opportunity-filters-wrapper";
import CreateButton from "@/components/common/create-button";
import SalesOpportunityCreateForm from "@/components/sales-opportunities/sales-opportunity-create-form";
import DeleteButton from "@/components/common/delete-button";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function SalesOpportunitiesPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    companyId?: string;
    estimatedAmount?: string;
    craneCount?: string;
    estimateCount?: string;
    occurredAfter?: string;
    occurredBefore?: string;
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
            <h1 className="text-2xl font-bold text-gray-900">営業案件一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              営業案件の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DeleteButton
              eventName="salesOpportunitySelectionChange"
              apiPath="/api/sales-opportunities"
              resourceName="営業案件"
            />
            <SalesOpportunityFilterButtonWrapper />
            <CreateButton
              title="営業案件を新規作成"
              formComponent={SalesOpportunityCreateForm}
              resourcePath="sales-opportunities"
            />
          </div>
        </div>

        {/* データテーブル部分 */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div>
            <SalesOpportunityFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <TableSkeleton rowCount={10} columnCount={9} />
              }
            >
              <SalesOpportunitiesPageContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
