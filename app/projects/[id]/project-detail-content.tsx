import { prisma } from "@/lib/prisma";
import ClientProjectDetail from "./client-project-detail";

interface ProjectDetailContentProps {
  id: string;
  canEdit: boolean;
}

export default async function ProjectDetailContent({
  id,
  canEdit,
}: ProjectDetailContentProps) {
  const project = await prisma.project.findUnique({
    where: { id },
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
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      salesOpportunity: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      equipment: {
        orderBy: {
          updatedAt: "desc",
        },
      },
      _count: {
        select: {
          equipment: true,
        },
      },
    },
  });

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">プロジェクトが見つかりません</p>
      </div>
    );
  }

  // Decimal型をnumber型に変換
  const projectWithNumberAmount = {
    ...project,
    amount: project.amount ? project.amount.toNumber() : null,
  };

  return (
    <ClientProjectDetail project={projectWithNumberAmount} canEdit={canEdit} />
  );
}

