import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientProjectDetail from "./client-project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
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
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">プロジェクトが見つかりません</p>
          <Link
            href="/projects"
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
      <ClientProjectDetail project={project} canEdit={canEdit} />
    </MainLayout>
  );
}

