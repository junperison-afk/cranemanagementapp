import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import WorkRecordsPageContent from "@/components/work-records/work-records-page-content";
import TableSkeleton from "@/components/common/table-skeleton";
import {
  WorkRecordFilterButtonWrapper,
  WorkRecordFilterPanelWrapper,
} from "@/components/work-records/work-record-filters-wrapper";
import CreateButton from "@/components/common/create-button";
import WorkRecordCreateForm from "@/components/work-records/work-record-create-form";
import DeleteButton from "@/components/common/delete-button";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function WorkRecordsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    equipmentId?: string;
    userId?: string;
    workType?: string;
    overallJudgment?: string;
    findings?: string;
    resultSummary?: string;
    inspectionDateAfter?: string;
    inspectionDateBefore?: string;
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
            <h1 className="text-2xl font-bold text-gray-900">作業記録一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              作業記録の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DeleteButton
              eventName="workRecordSelectionChange"
              apiPath="/api/work-records"
              resourceName="作業記録"
            />
            <WorkRecordFilterButtonWrapper />
            <CreateButton
              title="作業記録を新規作成"
              formComponent={WorkRecordCreateForm}
              resourcePath="work-records"
            />
          </div>
        </div>

        {/* データテーブル部分 */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div>
            <WorkRecordFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <TableSkeleton rowCount={10} columnCount={9} />
              }
            >
              <WorkRecordsPageContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

