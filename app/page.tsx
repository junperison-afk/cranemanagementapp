import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import QuickCreateButtons from "@/components/home/quick-create-buttons";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="mt-1 text-sm text-gray-500">
            プロジェクトと営業案件の概要を確認できます
          </p>
        </div>

        {/* クイック作成ボタン */}
        <QuickCreateButtons />

        {/* 進行中プロジェクト */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            進行中プロジェクト
          </h2>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                進行中のプロジェクトはありません
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プロジェクトタイトル
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      取引先
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      担当者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新日
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/companies/${project.company.id}`}
                          className="text-sm text-gray-900 hover:text-blue-600"
                        >
                          {project.company.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            project.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : project.status === "PLANNING"
                              ? "bg-gray-100 text-gray-800"
                              : project.status === "ON_HOLD"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {project.status === "IN_PROGRESS"
                            ? "進行中"
                            : project.status === "PLANNING"
                            ? "計画中"
                            : project.status === "ON_HOLD"
                            ? "保留"
                            : project.status === "COMPLETED"
                            ? "完了"
                            : project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.assignedUser
                          ? project.assignedUser.name || project.assignedUser.email
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(project.updatedAt).toLocaleDateString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 営業案件一覧 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            最近の営業案件
          </h2>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {salesOpportunities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                営業案件はありません
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      案件名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      取引先
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新日
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesOpportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/sales-opportunities/${opportunity.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {opportunity.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {opportunity.company.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            opportunity.status === "WON"
                              ? "bg-green-100 text-green-800"
                              : opportunity.status === "LOST"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {opportunity.status === "WON"
                            ? "受注"
                            : opportunity.status === "LOST"
                            ? "失注"
                            : "見積中"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(opportunity.updatedAt).toLocaleDateString(
                          "ja-JP"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
