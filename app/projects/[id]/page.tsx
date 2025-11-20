import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import Link from "next/link";
import ProjectDetailContent from "./project-detail-content";
import DetailSkeleton from "@/components/common/detail-skeleton";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const canEdit =
    session.user.role === "ADMIN" || session.user.role === "EDITOR";

  return (
    <MainLayout>
      <Suspense fallback={<DetailSkeleton />}>
        <ProjectDetailContent id={params.id} canEdit={canEdit} />
      </Suspense>
    </MainLayout>
  );
}

