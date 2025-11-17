import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientEquipmentDetail from "./client-equipment-detail";

export default async function EquipmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const equipment = await prisma.equipment.findUnique({
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
      project: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      inspectionRecords: {
        take: 10,
        orderBy: {
          inspectionDate: "desc",
        },
        select: {
          id: true,
          inspectionDate: true,
          findings: true,
          summary: true,
          updatedAt: true,
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
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">機器が見つかりません</p>
          <Link
            href="/equipment"
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
      <ClientEquipmentDetail equipment={equipment} canEdit={canEdit} />
    </MainLayout>
  );
}

