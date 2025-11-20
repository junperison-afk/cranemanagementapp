import { prisma } from "@/lib/prisma";
import HomeContent from "./home-content";

/**
 * ホームページのデータ取得コンポーネント（サーバーコンポーネント）
 */
export default async function HomePageContent() {
  // ダッシュボード用のデータ取得
  const [projects, salesOpportunities] = await Promise.all([
    prisma.project.findMany({
      take: 5,
      where: {
        status: {
          in: ["PLANNING", "IN_PROGRESS"],
        },
      },
      include: {
        company: true,
        assignedUser: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.salesOpportunity.findMany({
      take: 5,
      include: {
        company: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  return <HomeContent projects={projects} salesOpportunities={salesOpportunities} />;
}

