import { Suspense } from "react";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import HomePageContent from "@/components/home/home-page-content";
import HomeSkeleton from "@/components/home/home-skeleton";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <Suspense fallback={<HomeSkeleton />}>
        <HomePageContent />
      </Suspense>
    </MainLayout>
  );
}
