import { prisma } from "@/lib/prisma";
import ClientEquipmentDetail from "./client-equipment-detail";

interface EquipmentDetailContentProps {
  id: string;
  canEdit: boolean;
}

export default async function EquipmentDetailContent({
  id,
  canEdit,
}: EquipmentDetailContentProps) {
  const equipment = await prisma.equipment.findUnique({
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
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true,
          amount: true,
        },
      },
      inspectionRecords: {
        take: 10,
        orderBy: {
          inspectionDate: "desc",
        },
        select: {
          id: true,
          workType: true,
          inspectionDate: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          inspectionRecords: true,
        },
      },
    },
  });

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">機器が見つかりません</p>
      </div>
    );
  }

  // Decimal型をnumber型に変換
  const response = {
    ...equipment,
    project: equipment.project ? {
      ...equipment.project,
      amount: equipment.project.amount !== null && typeof equipment.project.amount === 'object' && 'toNumber' in equipment.project.amount
        ? (equipment.project.amount as any).toNumber()
        : equipment.project.amount !== null
        ? Number(equipment.project.amount)
        : null,
      status: String(equipment.project.status),
    } : null,
  };

  return <ClientEquipmentDetail equipment={response} canEdit={canEdit} />;
}

