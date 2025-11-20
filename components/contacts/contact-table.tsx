"use client";

import Link from "next/link";
import PaginationHeader from "@/components/common/pagination-header";
import { useTableSelection } from "@/hooks/use-table-selection";

interface Contact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
}

interface ContactTableProps {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function ContactTable({
  contacts,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
  onSelectionChange,
}: ContactTableProps) {
  const {
    selectedIds,
    selectAllCheckboxRef,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectOne,
    handleClick,
  } = useTableSelection(contacts, onSelectionChange);
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
        basePath="/contacts"
        filterLabels={{
          position: "役職",
          companyId: "取引先",
          phone: "電話番号",
          email: "メール",
          updatedAfter: "更新日（以降）",
          updatedBefore: "更新日（以前）",
        }}
      />

      {contacts.length === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center bg-white">
          <p className="text-gray-500">連絡先が見つかりません</p>
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
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    役職
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    取引先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    メール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    更新日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {contacts.map((contact, index) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onClick={handleClick}
                        onChange={(e) => handleSelectOne(contact.id, e.target.checked, index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {contact.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.position || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/companies/${contact.company.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {contact.company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.updatedAt).toLocaleDateString("ja-JP")}
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

