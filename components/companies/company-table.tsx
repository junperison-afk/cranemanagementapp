import Link from "next/link";

interface Company {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: Date;
  _count: {
    salesOpportunities: number;
    equipment: number;
    projects: number;
  };
}

interface CompanyTableProps {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function CompanyTable({
  companies,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: CompanyTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {companies.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center">
          <p className="text-gray-500">取引先が見つかりません</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会社名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    郵便番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    住所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関連情報
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
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/companies/${company.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.postalCode ? `〒${company.postalCode}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {company.address || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>案件: {company._count.salesOpportunities}</div>
                        <div>プロジェクト: {company._count.projects}</div>
                        <div>機器: {company._count.equipment}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.updatedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/companies/${company.id}`}
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
                    href={`/companies?${new URLSearchParams({
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
                    href={`/companies?${new URLSearchParams({
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

