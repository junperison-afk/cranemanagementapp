import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import EquipmentPageContent from "@/components/equipment/equipment-page-content";
import TableSkeleton from "@/components/common/table-skeleton";
import {
  EquipmentFilterButtonWrapper,
  EquipmentFilterPanelWrapper,
} from "@/components/equipment/equipment-filters-wrapper";
import CreateButton from "@/components/common/create-button";
import EquipmentCreateForm from "@/components/equipment/equipment-create-form";
import DeleteButton from "@/components/common/delete-button";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    companyId?: string;
    projectId?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
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
            <h1 className="text-2xl font-bold text-gray-900">機器一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              機器の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DeleteButton
              eventName="equipmentSelectionChange"
              apiPath="/api/equipment"
              resourceName="機器"
            />
            <EquipmentFilterButtonWrapper />
            <CreateButton
              title="機器を新規作成"
              formComponent={EquipmentCreateForm}
              resourcePath="equipment"
            />
          </div>
        </div>

        {/* データテーブル部分 */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div>
            <EquipmentFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <Suspense
              fallback={
                <TableSkeleton rowCount={10} columnCount={9} />
              }
            >
              <EquipmentPageContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
