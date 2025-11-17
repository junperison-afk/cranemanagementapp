import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    title: string;
  } | null;
  _count: {
    inspectionRecords: number;
  };
}

interface EquipmentTableProps {
  equipment: Equipment[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function EquipmentTable({
  equipment,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: EquipmentTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {equipment.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center">
          <p className="text-gray-500">機器が見つかりません</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    機器名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    機種・型式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    製造番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    設置場所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    取引先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    プロジェクト
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    点検回数
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
                {equipment.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/equipment/${item.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.model || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.serialNumber || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.location || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/companies/${item.company.id}`}
                        className="text-sm text-gray-900 hover:text-blue-600"
                      >
                        {item.company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.project ? (
                        <Link
                          href={`/projects/${item.project.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {item.project.title}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item._count.inspectionRecords}回
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.updatedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/equipment/${item.id}`}
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
                    href={`/equipment?${new URLSearchParams({
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
                    href={`/equipment?${new URLSearchParams({
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

