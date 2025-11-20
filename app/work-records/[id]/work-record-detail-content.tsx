import { prisma } from "@/lib/prisma";
import ClientWorkRecordDetail from "./client-inspection-record-detail";

interface WorkRecordDetailContentProps {
  id: string;
  canEdit: boolean;
}

export default async function WorkRecordDetailContent({
  id,
  canEdit,
}: WorkRecordDetailContentProps) {
  const inspectionRecord = await prisma.inspectionRecord.findUnique({
    where: { id },
    include: {
      equipment: {
        select: {
          id: true,
          name: true,
          model: true,
          serialNumber: true,
          location: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!inspectionRecord) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">作業記録が見つかりません</p>
      </div>
    );
  }

  return (
    <ClientWorkRecordDetail
      workRecord={inspectionRecord}
      canEdit={canEdit}
    />
  );
}

