import Link from "next/link";

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
}: WorkRecordTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {workRecords.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center">
          <p className="text-gray-500">作業記録が見つかりません</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto border-b border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作業日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作業タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    機器
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    総合判定
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    所見
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    結果サマリ
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
                {workRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/work-records/${record.id}`}
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
                    href={`/work-records?${new URLSearchParams({
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
                    href={`/work-records?${new URLSearchParams({
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

