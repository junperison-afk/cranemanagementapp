import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  EquipmentFilterButtonWrapper,
  EquipmentFilterPanelWrapper,
} from "@/components/equipment/equipment-filters-wrapper";
import EquipmentTable from "@/components/equipment/equipment-table";

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
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
  const limit = 20;
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
      <div className="space-y-6 h-full flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">機器一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              機器の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <EquipmentFilterButtonWrapper />
            {(session.user.role === "ADMIN" ||
              session.user.role === "EDITOR") && (
              <Link
                href="/equipment/new"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-5 w-5" />
                新規作成
              </Link>
            )}
          </div>
        </div>

        {/* データテーブル部分（2分割可能） */}
        <div className="flex-1 flex gap-6 min-h-0">
          {/* フィルターパネル */}
          <EquipmentFilterPanelWrapper />

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <EquipmentTable
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
      </div>
    </MainLayout>
  );
}
