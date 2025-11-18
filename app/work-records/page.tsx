import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  WorkRecordFilterButtonWrapper,
  WorkRecordFilterPanelWrapper,
} from "@/components/work-records/work-record-filters-wrapper";
import WorkRecordTable from "@/components/work-records/work-record-table";

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
    inspectionDateAfter?: string;
    inspectionDateBefore?: string;
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
        { findings: { contains: search } },
        { summary: { contains: search } },
        { additionalNotes: { contains: search } },
        { equipment: { name: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ],
    });
  }

  // 機器フィルター
  if (searchParams.equipmentId) {
    whereConditions.push({
      equipmentId: searchParams.equipmentId,
    });
  }

  // 担当者フィルター
  if (searchParams.userId) {
    whereConditions.push({
      userId: searchParams.userId,
    });
  }

  // 作業タイプフィルター
  if (searchParams.workType) {
    whereConditions.push({
      workType: searchParams.workType,
    });
  }

  // 総合判定フィルター
  if (searchParams.overallJudgment) {
    whereConditions.push({
      overallJudgment: searchParams.overallJudgment,
    });
  }

  // 点検日フィルター
  if (searchParams.inspectionDateAfter) {
    whereConditions.push({
      inspectionDate: { gte: new Date(searchParams.inspectionDateAfter) },
    });
  }

  if (searchParams.inspectionDateBefore) {
    whereConditions.push({
      inspectionDate: { lte: new Date(searchParams.inspectionDateBefore) },
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  // Prismaのenum型のnullを回避するため、overallJudgmentとworkTypeを除外して取得
  const [rawRecords, total] = await Promise.all([
    prisma.inspectionRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        inspectionDate: "desc",
      },
      select: {
        id: true,
        inspectionDate: true,
        findings: true,
        summary: true,
        updatedAt: true,
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.inspectionRecord.count({ where }),
  ]);

  // workTypeとoverallJudgmentを別途取得（Prismaのenum型のnullを回避）
  const recordIds = rawRecords.map((r) => r.id);
  let workTypeMap = new Map<string, string>();
  let judgmentMap = new Map<string, string | null>();
  
  if (recordIds.length > 0) {
    const placeholders = recordIds.map((_, i) => `$${i + 1}`).join(", ");
    const [workTypes, judgments] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{
        id: string;
        workType: string;
      }>>(
        `SELECT id, "workType" FROM inspection_records WHERE id IN (${placeholders})`,
        ...recordIds
      ),
      prisma.$queryRawUnsafe<Array<{
        id: string;
        overallJudgment: string | null;
      }>>(
        `SELECT id, "overallJudgment" FROM inspection_records WHERE id IN (${placeholders})`,
        ...recordIds
      ),
    ]);
    workTypeMap = new Map(workTypes.map((w) => [w.id, w.workType]));
    judgmentMap = new Map(judgments.map((j) => [j.id, j.overallJudgment]));
  }

  // 結果を結合
  const inspectionRecords = rawRecords.map((record) => ({
    ...record,
    workType: workTypeMap.get(record.id) as "INSPECTION" | "REPAIR" | "MAINTENANCE" | "OTHER",
    overallJudgment: judgmentMap.get(record.id) as "GOOD" | "CAUTION" | "BAD" | "REPAIR" | null,
  }));

  const totalPages = Math.ceil(total / limit);

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
            <WorkRecordFilterButtonWrapper />
            {(session.user.role === "ADMIN" ||
              session.user.role === "EDITOR") && (
              <Link
                href="/work-records/new"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-5 w-5" />
                新規作成
              </Link>
            )}
          </div>
        </div>

        {/* データテーブル部分（2分割可能） */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div className="mr-6">
            <WorkRecordFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <WorkRecordTable
              workRecords={inspectionRecords}
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

