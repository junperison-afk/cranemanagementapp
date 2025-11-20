import { prisma } from "@/lib/prisma";
import ClientCompanyDetail from "./client-company-detail";

interface CompanyDetailContentProps {
  id: string;
  canEdit: boolean;
}

export default async function CompanyDetailContent({
  id,
  canEdit,
}: CompanyDetailContentProps) {
  const company = await prisma.company.findUnique({
    where: { id },
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
      <div className="text-center py-12">
        <p className="text-gray-500">取引先が見つかりません</p>
      </div>
    );
  }

  return <ClientCompanyDetail company={company} canEdit={canEdit} />;
}

