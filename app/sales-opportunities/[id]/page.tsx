import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientSalesOpportunityDetail from "./client-sales-opportunity-detail";

export default async function SalesOpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const salesOpportunity = await prisma.salesOpportunity.findUnique({
    where: { id: params.id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          postalCode: true,
          address: true,
          phone: true,
          email: true,
        },
      },
      quotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
      contract: true,
      project: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      _count: {
        select: {
          quotes: true,
        },
      },
    },
  });

  if (!salesOpportunity) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">営業案件が見つかりません</p>
          <Link
            href="/sales-opportunities"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            一覧に戻る
          </Link>
        </div>
      </MainLayout>
    );
  }

  const canEdit =
    session.user.role === "ADMIN" || session.user.role === "EDITOR";

  return (
    <MainLayout>
      <ClientSalesOpportunityDetail
        salesOpportunity={salesOpportunity}
        canEdit={canEdit}
      />
    </MainLayout>
  );
}

