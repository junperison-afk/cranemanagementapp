"use client";

import Link from "next/link";
import PaginationHeader from "@/components/common/pagination-header";
import { useTableSelection } from "@/hooks/use-table-selection";

interface WorkRecord {
  id: string;
  workType: "INSPECTION" | "REPAIR" | "MAINTENANCE" | "OTHER";
  inspectionDate: Date;
  overallJudgment: "GOOD" | "CAUTION" | "BAD" | "REPAIR" | null;
  findings: string | null;
  summary: string | null;
  updatedAt: Date;
  equipment: {
    id: string;
    name: string;
    model: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface WorkRecordTableProps {
  workRecords: WorkRecord[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  onSelectionChange?: (selectedIds: string[]) => void;
}

const workTypeLabels: Record<string, string> = {
  INSPECTION: "点検",
  REPAIR: "修理",
  MAINTENANCE: "メンテナンス",
  OTHER: "その他",
};

const workTypeColors: Record<string, string> = {
  INSPECTION: "bg-blue-100 text-blue-800",
  REPAIR: "bg-red-100 text-red-800",
  MAINTENANCE: "bg-purple-100 text-purple-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const judgmentLabels: Record<string, string> = {
  GOOD: "良好",
  CAUTION: "注意",
  BAD: "不良",
  REPAIR: "要修理",
};

const judgmentColors: Record<string, string> = {
  GOOD: "bg-green-100 text-green-800",
  CAUTION: "bg-yellow-100 text-yellow-800",
  BAD: "bg-orange-100 text-orange-800",
  REPAIR: "bg-red-100 text-red-800",
};

export default function WorkRecordTable({
  workRecords,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
  onSelectionChange,
}: WorkRecordTableProps) {
  const {
    selectedIds,
    selectAllCheckboxRef,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectOne,
    handleClick,
  } = useTableSelection(workRecords, onSelectionChange);
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {workRecords.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center">
          <p className="text-gray-500">作業記録が見つかりません</p>
        </div>
      ) : (
        <>
          <PaginationHeader
            total={total}
            page={page}
            limit={limit}
            skip={skip}
            totalPages={totalPages}
            searchParams={searchParams}
            basePath="/work-records"
            filterLabels={{
              equipmentId: "機器",
              userId: "担当者",
              workType: "作業タイプ",
              overallJudgment: "総合判定",
              findings: "所見",
              resultSummary: "結果サマリ",
              inspectionDateAfter: "作業日（以降）",
              inspectionDateBefore: "作業日（以前）",
              updatedAfter: "更新日（以降）",
              updatedBefore: "更新日（以前）",
            }}
            filterValueFormatters={{
              workType: (value) => workTypeLabels[value] || value,
              overallJudgment: (value) => judgmentLabels[value] || value,
            }}
          />
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
                    作業名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    作業日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    作業タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    機器
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    総合判定
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    所見
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    結果サマリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    更新日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {workRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onClick={handleClick}
                        onChange={(e) => handleSelectOne(record.id, e.target.checked, index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/work-records/${record.id}`}
                        prefetch={true}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {workTypeLabels[record.workType]} - {record.equipment.name}
                        {record.equipment.model && ` (${record.equipment.model})`}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.inspectionDate).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          workTypeColors[record.workType]
                        }`}
                      >
                        {workTypeLabels[record.workType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/equipment/${record.equipment.id}`}
                        prefetch={true}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {record.equipment.name}
                        {record.equipment.model && ` (${record.equipment.model})`}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.user.name || record.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.overallJudgment ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            judgmentColors[record.overallJudgment]
                          }`}
                        >
                          {judgmentLabels[record.overallJudgment]}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.findings || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.summary || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.updatedAt).toLocaleDateString("ja-JP")}
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

