import { prisma } from "@/lib/prisma";
import SalesOpportunitiesPageClient from "./sales-opportunities-page-client";

interface SalesOpportunitiesPageContentProps {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    companyId?: string;
    estimatedAmount?: string;
    craneCount?: string;
    estimateCount?: string;
    occurredAfter?: string;
    occurredBefore?: string;
  };
}

export default async function SalesOpportunitiesPageContent({
  searchParams,
}: SalesOpportunitiesPageContentProps) {
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

  // 想定金額フィルター
  if (searchParams.estimatedAmount) {
    const estimatedAmountValue = parseFloat(searchParams.estimatedAmount);
    if (!isNaN(estimatedAmountValue)) {
      whereConditions.push({
        estimatedAmount: { equals: estimatedAmountValue },
      });
    }
  }

  // クレーン台数フィルター
  if (searchParams.craneCount) {
    const craneCountValue = parseInt(searchParams.craneCount);
    if (!isNaN(craneCountValue)) {
      whereConditions.push({
        craneCount: { equals: craneCountValue },
      });
    }
  }

  // 見積数フィルター（_count.quotesを使用）
  if (searchParams.estimateCount) {
    const estimateCountValue = parseInt(searchParams.estimateCount);
    if (!isNaN(estimateCountValue)) {
      // 見積数でのフィルターは、取得後にフィルタリングする必要があるため、
      // ここでは処理しない（または別の方法で実装）
    }
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
    <SalesOpportunitiesPageClient
      salesOpportunities={salesOpportunitiesWithNumberAmount}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

