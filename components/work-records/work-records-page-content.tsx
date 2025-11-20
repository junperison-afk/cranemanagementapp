import { prisma } from "@/lib/prisma";
import WorkRecordsPageClient from "./work-records-page-client";

interface WorkRecordsPageContentProps {
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
}

export default async function WorkRecordsPageContent({
  searchParams,
}: WorkRecordsPageContentProps) {
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

  // 所見フィルター
  if (searchParams.findings) {
    whereConditions.push({
      findings: { contains: searchParams.findings },
    });
  }

  // 結果サマリフィルター
  if (searchParams.resultSummary) {
    whereConditions.push({
      summary: { contains: searchParams.resultSummary },
    });
  }

  // 更新日時フィルター
  if (searchParams.updatedAfter) {
    whereConditions.push({
      updatedAt: { gte: new Date(searchParams.updatedAfter) },
    });
  }

  if (searchParams.updatedBefore) {
    whereConditions.push({
      updatedAt: { lte: new Date(searchParams.updatedBefore) },
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
    <WorkRecordsPageClient
      workRecords={inspectionRecords}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

