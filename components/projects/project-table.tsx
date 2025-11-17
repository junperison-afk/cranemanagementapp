import Link from "next/link";

interface Project {
  id: string;
  title: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  startDate: Date | null;
  endDate: Date | null;
  amount: number | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  salesOpportunity: {
    id: string;
    title: string;
  } | null;
  _count: {
    equipment: number;
  };
}

interface ProjectTableProps {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

const statusLabels: Record<string, string> = {
  PLANNING: "計画中",
  IN_PROGRESS: "進行中",
  ON_HOLD: "保留",
  COMPLETED: "完了",
};

const statusColors: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function ProjectTable({
  projects,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: ProjectTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {projects.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center">
          <p className="text-gray-500">プロジェクトが見つかりません</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
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
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    機器数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    開始日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
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
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[project.status]
                        }`}
                      >
                        {statusLabels[project.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.assignedUser?.name || project.assignedUser?.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.amount
                        ? `¥${project.amount.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project._count.equipment}台
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString("ja-JP")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.updatedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-gray-700">
                {total}件中 {skip + 1}〜{Math.min(skip + limit, total)}件を表示
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/projects?${new URLSearchParams({
                      ...searchParams,
                      page: String(page - 1),
                    }).toString()}`}
                    className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    前へ
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/projects?${new URLSearchParams({
                      ...searchParams,
                      page: String(page + 1),
                    }).toString()}`}
                    className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    次へ
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

