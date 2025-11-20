"use client";

import Link from "next/link";
import PaginationHeader from "@/components/common/pagination-header";
import { useTableSelection } from "@/hooks/use-table-selection";

interface SalesOpportunity {
  id: string;
  title: string;
  status: "ESTIMATING" | "WON" | "LOST";
  estimatedAmount: number | null;
  craneCount: number | null;
  craneInfo: string | null;
  occurredAt: Date | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  _count: {
    quotes: number;
  };
}

interface SalesOpportunityTableProps {
  salesOpportunities: SalesOpportunity[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  onSelectionChange?: (selectedIds: string[]) => void;
}

const statusLabels: Record<string, string> = {
  ESTIMATING: "見積中",
  WON: "受注",
  LOST: "失注",
};

const statusColors: Record<string, string> = {
  ESTIMATING: "bg-yellow-100 text-yellow-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

export default function SalesOpportunityTable({
  salesOpportunities,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
  onSelectionChange,
}: SalesOpportunityTableProps) {
  const {
    selectedIds,
    selectAllCheckboxRef,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectOne,
    handleClick,
  } = useTableSelection(salesOpportunities, onSelectionChange);
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
        basePath="/sales-opportunities"
        filterLabels={{
          status: "ステータス",
          companyId: "取引先",
          estimatedAmount: "想定金額",
          craneCount: "クレーン台数",
          estimateCount: "見積数",
          occurredAfter: "発生日（以降）",
          occurredBefore: "発生日（以前）",
        }}
        filterValueFormatters={{
          status: (value) => statusLabels[value] || value,
        }}
      />

      {salesOpportunities.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center bg-white">
          <p className="text-gray-500">営業案件が見つかりません</p>
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
                    案件タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    取引先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    想定金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    クレーン台数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    見積数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    発生日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    更新日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {salesOpportunities.map((opportunity, index) => (
                  <tr
                    key={opportunity.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(opportunity.id)}
                        onClick={handleClick}
                        onChange={(e) => handleSelectOne(opportunity.id, e.target.checked, index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/sales-opportunities/${opportunity.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {opportunity.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/companies/${opportunity.company.id}`}
                        className="text-sm text-gray-900 hover:text-blue-600"
                      >
                        {opportunity.company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[opportunity.status]
                        }`}
                      >
                        {statusLabels[opportunity.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {opportunity.estimatedAmount
                        ? `¥${opportunity.estimatedAmount.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {opportunity.craneCount || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity._count.quotes}件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.occurredAt
                        ? new Date(opportunity.occurredAt).toLocaleDateString(
                            "ja-JP"
                          )
                        : "-"}
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
          </div>
        </>
      )}
    </div>
  );
}

