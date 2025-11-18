import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import {
  SalesOpportunityFilterButtonWrapper,
  SalesOpportunityFilterPanelWrapper,
} from "@/components/sales-opportunities/sales-opportunity-filters-wrapper";
import SalesOpportunityTable from "@/components/sales-opportunities/sales-opportunity-table";
import CreateButton from "@/components/common/create-button";
import SalesOpportunityCreateForm from "@/components/sales-opportunities/sales-opportunity-create-form";

export default async function SalesOpportunitiesPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    companyId?: string;
    occurredAfter?: string;
    occurredBefore?: string;
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
        { craneInfo: { contains: search } },
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

  // 発生日フィルター
  if (searchParams.occurredAfter) {
    whereConditions.push({
      occurredAt: { gte: new Date(searchParams.occurredAfter) },
    });
  }

  if (searchParams.occurredBefore) {
    whereConditions.push({
      occurredAt: { lte: new Date(searchParams.occurredBefore) },
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [salesOpportunities, total] = await Promise.all([
    prisma.salesOpportunity.findMany({
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
        _count: {
          select: {
            quotes: true,
          },
        },
      },
    }),
    prisma.salesOpportunity.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Decimal型をnumber型に変換
  const salesOpportunitiesWithNumberAmount = salesOpportunities.map(
    (salesOpportunity) => ({
      ...salesOpportunity,
      estimatedAmount: salesOpportunity.estimatedAmount
        ? salesOpportunity.estimatedAmount.toNumber()
        : null,
    })
  );

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between flex-shrink-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">営業案件一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              営業案件の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SalesOpportunityFilterButtonWrapper />
            <CreateButton
              title="営業案件を新規作成"
              formComponent={SalesOpportunityCreateForm}
              resourcePath="sales-opportunities"
            />
          </div>
        </div>

        {/* データテーブル部分（2分割可能） */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div className="mr-6">
            <SalesOpportunityFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <SalesOpportunityTable
              salesOpportunities={salesOpportunitiesWithNumberAmount}
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
