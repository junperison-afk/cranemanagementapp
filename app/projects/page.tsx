import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import ProjectsPageContent from "@/components/projects/projects-page-content";
import TableSkeleton from "@/components/common/table-skeleton";
import {
  ProjectFilterButtonWrapper,
  ProjectFilterPanelWrapper,
} from "@/components/projects/project-filters-wrapper";
import CreateButton from "@/components/common/create-button";
import ProjectCreateForm from "@/components/projects/project-create-form";
import DeleteButton from "@/components/common/delete-button";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    companyId?: string;
    assignedUserId?: string;
    amount?: string;
    equipmentCount?: string;
    startDateAfter?: string;
    startDateBefore?: string;
    endDateAfter?: string;
    endDateBefore?: string;
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
            <h1 className="text-2xl font-bold text-gray-900">プロジェクト一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              プロジェクトの検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DeleteButton
              eventName="projectSelectionChange"
              apiPath="/api/projects"
              resourceName="プロジェクト"
            />
            <ProjectFilterButtonWrapper />
            <CreateButton
              title="プロジェクトを新規作成"
              formComponent={ProjectCreateForm}
              resourcePath="projects"
            />
          </div>
        </div>

        {/* データテーブル部分 */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div>
            <ProjectFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <TableSkeleton rowCount={10} columnCount={9} />
              }
            >
              <ProjectsPageContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
