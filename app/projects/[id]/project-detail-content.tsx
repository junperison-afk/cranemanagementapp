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
          estimatedAmount: true,
          occurredAt: true,
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

  // プロジェクトに紐づく作業記録を取得して、機器ごとにカウントとデータを整理
  const inspectionRecords = await prisma.inspectionRecord.findMany({
    where: {
      projectId: id,
    },
    select: {
      id: true,
      equipmentId: true,
      inspectionDate: true,
      workType: true,
      equipment: {
        select: {
          id: true,
          name: true,
          model: true,
        },
      },
    },
    orderBy: {
      inspectionDate: "desc",
    },
  });

  // 機器ごとの作業記録をグループ化
  const equipmentRecordsMap = inspectionRecords.reduce((acc, record) => {
    if (!acc[record.equipmentId]) {
      acc[record.equipmentId] = [];
    }
    acc[record.equipmentId].push({
      id: record.id,
      inspectionDate: record.inspectionDate,
      workType: record.workType,
      equipment: record.equipment,
    });
    return acc;
  }, {} as Record<string, Array<{ id: string; inspectionDate: Date; workType: string; equipment: { id: string; name: string; model: string | null } }>>);

  // 機器ごとの作業記録数をカウント
  const equipmentRecordCounts = inspectionRecords.reduce((acc, record) => {
    acc[record.equipmentId] = (acc[record.equipmentId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 各機器にカウント情報と作業記録データを追加
  const equipmentWithCounts = project.equipment.map((eq) => ({
    ...eq,
    _count: {
      inspectionRecords: equipmentRecordCounts[eq.id] || 0,
    },
    inspectionRecords: equipmentRecordsMap[eq.id] || [],
  }));

  // Decimal型をnumber型に変換
  const projectWithNumberAmount = {
    ...project,
    amount: project.amount ? project.amount.toNumber() : null,
    salesOpportunity: project.salesOpportunity
      ? {
          ...project.salesOpportunity,
          estimatedAmount: project.salesOpportunity.estimatedAmount
            ? project.salesOpportunity.estimatedAmount.toNumber()
            : null,
        }
      : null,
    equipment: equipmentWithCounts,
  };

  return (
    <ClientProjectDetail project={projectWithNumberAmount} canEdit={canEdit} />
  );
}

