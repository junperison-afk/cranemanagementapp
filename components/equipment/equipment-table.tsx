"use client";

import Link from "next/link";
import PaginationHeader from "@/components/common/pagination-header";
import { useTableSelection } from "@/hooks/use-table-selection";

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
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function EquipmentTable({
  equipment,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
  onSelectionChange,
}: EquipmentTableProps) {
  const {
    selectedIds,
    selectAllCheckboxRef,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectOne,
    handleClick,
  } = useTableSelection(equipment, onSelectionChange);
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
        basePath="/equipment"
        filterLabels={{
          model: "機種・型式",
          serialNumber: "製造番号",
          location: "設置場所",
          updatedAfter: "更新日（以降）",
          updatedBefore: "更新日（以前）",
        }}
      />

      {equipment.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center bg-white">
          <p className="text-gray-500">機器が見つかりません</p>
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
                    機器名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    機種・型式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    製造番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    設置場所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    取引先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    プロジェクト
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    点検回数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    更新日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {equipment.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors border-b border-gray-200`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onClick={handleClick}
                        onChange={(e) => handleSelectOne(item.id, e.target.checked, index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
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

