import Link from "next/link";

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
}: SalesOpportunityTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {salesOpportunities.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center">
          <p className="text-gray-500">営業案件が見つかりません</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    案件タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    取引先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    想定金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クレーン台数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    見積数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    発生日
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
                {salesOpportunities.map((opportunity) => (
                  <tr
                    key={opportunity.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/sales-opportunities/${opportunity.id}`}
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
                    href={`/sales-opportunities?${new URLSearchParams({
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
                    href={`/sales-opportunities?${new URLSearchParams({
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

