import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientWorkRecordDetail from "./client-inspection-record-detail";

export default async function WorkRecordDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const inspectionRecord = await prisma.inspectionRecord.findUnique({
    where: { id: params.id },
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
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">作業記録が見つかりません</p>
          <Link
            href="/work-records"
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
      <ClientWorkRecordDetail
        workRecord={inspectionRecord}
        canEdit={canEdit}
      />
    </MainLayout>
  );
}

