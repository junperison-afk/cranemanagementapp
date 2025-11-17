import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import ClientCompanyDetail from "./client-company-detail";

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      contacts: {
        orderBy: {
          createdAt: "desc",
        },
      },
      salesOpportunities: {
        take: 10,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          _count: {
            select: {
              quotes: true,
            },
          },
        },
      },
      equipment: {
        take: 10,
        orderBy: {
          updatedAt: "desc",
        },
      },
      projects: {
        take: 10,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          assignedUser: true,
        },
      },
      _count: {
        select: {
          contacts: true,
          salesOpportunities: true,
          equipment: true,
          projects: true,
        },
      },
    },
  });

  if (!company) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">取引先が見つかりません</p>
          <Link
            href="/companies"
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
      <ClientCompanyDetail company={company} canEdit={canEdit} />
    </MainLayout>
  );
}

