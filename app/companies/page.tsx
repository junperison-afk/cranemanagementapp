import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import CompaniesPageClient from "@/components/companies/companies-page-client";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    postalCode?: string;
    address?: string;
    phone?: string;
    email?: string;
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
  const limit = parseInt(searchParams.limit || "20");
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

  // 郵便番号フィルター
  if (searchParams.postalCode) {
    whereConditions.push({
      postalCode: { contains: searchParams.postalCode },
    });
  }

  // 住所フィルター
  if (searchParams.address) {
    whereConditions.push({
      address: { contains: searchParams.address },
    });
  }

  // 電話番号フィルター
  if (searchParams.phone) {
    whereConditions.push({
      phone: { contains: searchParams.phone },
    });
  }

  // メールフィルター
  if (searchParams.email) {
    whereConditions.push({
      email: { contains: searchParams.email },
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
      <CompaniesPageClient
        companies={companies}
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
