import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  ProjectFilterButtonWrapper,
  ProjectFilterPanelWrapper,
} from "@/components/projects/project-filters-wrapper";
import ProjectTable from "@/components/projects/project-table";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    status?: string;
    companyId?: string;
    assignedUserId?: string;
    startDateAfter?: string;
    startDateBefore?: string;
    endDateAfter?: string;
    endDateBefore?: string;
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
      <div className="space-y-6 h-full flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">プロジェクト一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              プロジェクトの検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ProjectFilterButtonWrapper />
            {(session.user.role === "ADMIN" ||
              session.user.role === "EDITOR") && (
              <Link
                href="/projects/new"
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
          <ProjectFilterPanelWrapper />

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <ProjectTable
              projects={projectsWithNumberAmount}
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
