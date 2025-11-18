import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  CompanyFilterButtonWrapper,
  CompanyFilterPanelWrapper,
} from "@/components/companies/company-filters-wrapper";
import CompanyTable from "@/components/companies/company-table";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    industryType?: string;
    billingFlag?: string;
    hasSalesOpportunities?: string;
    hasProjects?: string;
    hasEquipment?: string;
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
  const limit = 20;
  const skip = (page - 1) * limit;

  // フィルター条件の構築
  const whereConditions: any[] = [];

  // 検索条件
  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: search } },
        { address: { contains: search } },
        { email: { contains: search } },
      ],
    });
  }

  // 業種フィルター
  if (searchParams.industryType) {
    whereConditions.push({
      industryType: { contains: searchParams.industryType },
    });
  }

  // 請求フラグフィルター
  if (
    searchParams.billingFlag !== undefined &&
    searchParams.billingFlag !== ""
  ) {
    whereConditions.push({
      billingFlag: searchParams.billingFlag === "true",
    });
  }

  // 関連情報のフィルター
  if (searchParams.hasSalesOpportunities === "true") {
    whereConditions.push({
      salesOpportunities: { some: {} },
    });
  }

  if (searchParams.hasProjects === "true") {
    whereConditions.push({
      projects: { some: {} },
    });
  }

  if (searchParams.hasEquipment === "true") {
    whereConditions.push({
      equipment: { some: {} },
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

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            salesOpportunities: true,
            equipment: true,
            projects: true,
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <MainLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">取引先一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              取引先の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CompanyFilterButtonWrapper />
            {(session.user.role === "ADMIN" ||
              session.user.role === "EDITOR") && (
              <Link
                href="/companies/new"
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
          <CompanyFilterPanelWrapper />

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <CompanyTable
              companies={companies}
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
