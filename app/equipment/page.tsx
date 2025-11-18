import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import {
  EquipmentFilterButtonWrapper,
  EquipmentFilterPanelWrapper,
} from "@/components/equipment/equipment-filters-wrapper";
import EquipmentTableWrapper from "@/components/equipment/equipment-table-wrapper";
import CreateButton from "@/components/common/create-button";
import EquipmentCreateForm from "@/components/equipment/equipment-create-form";

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    companyId?: string;
    projectId?: string;
  };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "20");
  const skip = (page - 1) * limit;

  // フィルター条件の構築
  const whereConditions: any[] = [];

  // 検索条件
  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: search } },
        { model: { contains: search } },
        { serialNumber: { contains: search } },
        { location: { contains: search } },
        { notes: { contains: search } },
        { company: { name: { contains: search } } },
      ],
    });
  }

  // 取引先フィルター
  if (searchParams.companyId) {
    whereConditions.push({
      companyId: searchParams.companyId,
    });
  }

  // プロジェクトフィルター
  if (searchParams.projectId) {
    whereConditions.push({
      projectId: searchParams.projectId,
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [equipment, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            inspectionRecords: true,
          },
        },
      },
    }),
    prisma.equipment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

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
            <EquipmentFilterButtonWrapper />
            <CreateButton
              title="機器を新規作成"
              formComponent={EquipmentCreateForm}
              resourcePath="equipment"
            />
          </div>
        </div>

        {/* データテーブル部分（2分割可能） */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div className="mr-6">
            <EquipmentFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <EquipmentTableWrapper
            equipment={equipment}
            total={total}
            page={page}
            limit={limit}
            skip={skip}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        </div>
      </div>
    </MainLayout>
  );
}
