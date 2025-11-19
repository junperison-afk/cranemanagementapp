import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import ProjectsPageClient from "@/components/projects/projects-page-client";

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
        { title: { contains: search } },
        { notes: { contains: search } },
        { company: { name: { contains: search } } },
      ],
    });
  }

  // ステータスフィルター
  if (searchParams.status) {
    whereConditions.push({
      status: searchParams.status,
    });
  }

  // 取引先フィルター
  if (searchParams.companyId) {
    whereConditions.push({
      companyId: searchParams.companyId,
    });
  }

  // 担当者フィルター
  if (searchParams.assignedUserId) {
    whereConditions.push({
      assignedUserId: searchParams.assignedUserId,
    });
  }

  // 開始日フィルター
  if (searchParams.startDateAfter) {
    whereConditions.push({
      startDate: { gte: new Date(searchParams.startDateAfter) },
    });
  }

  if (searchParams.startDateBefore) {
    whereConditions.push({
      startDate: { lte: new Date(searchParams.startDateBefore) },
    });
  }

  // 終了日フィルター
  if (searchParams.endDateAfter) {
    whereConditions.push({
      endDate: { gte: new Date(searchParams.endDateAfter) },
    });
  }

  if (searchParams.endDateBefore) {
    whereConditions.push({
      endDate: { lte: new Date(searchParams.endDateBefore) },
    });
  }

  // 金額フィルター
  if (searchParams.amount) {
    const amountValue = parseFloat(searchParams.amount);
    if (!isNaN(amountValue)) {
      whereConditions.push({
        amount: { equals: amountValue },
      });
    }
  }

  // 機器数フィルター（_count.equipmentを使用）
  if (searchParams.equipmentCount) {
    const equipmentCountValue = parseInt(searchParams.equipmentCount);
    if (!isNaN(equipmentCountValue)) {
      // 機器数でのフィルターは、取得後にフィルタリングする必要があるため、
      // ここでは処理しない（または別の方法で実装）
    }
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

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        salesOpportunity: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Decimal型をnumber型に変換
  const projectsWithNumberAmount = projects.map((project) => ({
    ...project,
    amount: project.amount ? project.amount.toNumber() : null,
  }));

  return (
    <MainLayout>
      <ProjectsPageClient
        projects={projectsWithNumberAmount}
        total={total}
        page={page}
        limit={limit}
        skip={skip}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </MainLayout>
  );
}
