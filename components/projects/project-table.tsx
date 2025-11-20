"use client";

import Link from "next/link";
import PaginationHeader from "@/components/common/pagination-header";
import { useTableSelection } from "@/hooks/use-table-selection";

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
  onSelectionChange?: (selectedIds: string[]) => void;
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
  onSelectionChange,
}: ProjectTableProps) {
  const {
    selectedIds,
    selectAllCheckboxRef,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectOne,
    handleClick,
  } = useTableSelection(projects, onSelectionChange);
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* データ件数とページネーション */}
      <PaginationHeader
        total={total}
        page={page}
        limit={limit}
        skip={skip}
        totalPages={totalPages}
        searchParams={searchParams}
        basePath="/projects"
        filterLabels={{
          status: "ステータス",
          companyId: "取引先",
          assignedUserId: "担当者",
          amount: "金額",
          equipmentCount: "機器数",
          startDateAfter: "開始日（以降）",
          startDateBefore: "開始日（以前）",
          endDateAfter: "終了日（以降）",
          endDateBefore: "終了日（以前）",
          updatedAfter: "更新日（以降）",
          updatedBefore: "更新日（以前）",
        }}
        filterValueFormatters={{
          status: (value) => statusLabels[value] || value,
        }}
      />

      {projects.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center bg-white">
          <p className="text-gray-500">プロジェクトが見つかりません</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto bg-white border-b border-gray-200">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12">
                    <input
                      type="checkbox"
                      ref={selectAllCheckboxRef}
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    プロジェクトタイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    取引先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    機器数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    開始日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    更新日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {projects.map((project, index) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(project.id)}
                        onClick={handleClick}
                        onChange={(e) => handleSelectOne(project.id, e.target.checked, index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

