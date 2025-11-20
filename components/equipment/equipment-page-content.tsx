import { prisma } from "@/lib/prisma";
import EquipmentPageClient from "./equipment-page-client";

interface EquipmentPageContentProps {
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
}

export default async function EquipmentPageContent({
  searchParams,
}: EquipmentPageContentProps) {
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

  // 機種・型式フィルター
  if (searchParams.model) {
    whereConditions.push({
      model: { contains: searchParams.model },
    });
  }

  // 製造番号フィルター
  if (searchParams.serialNumber) {
    whereConditions.push({
      serialNumber: { contains: searchParams.serialNumber },
    });
  }

  // 設置場所フィルター
  if (searchParams.location) {
    whereConditions.push({
      location: { contains: searchParams.location },
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
    <EquipmentPageClient
      equipment={equipment}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

