"use client";

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
}

/**
 * テーブルのスケルトンUIコンポーネント
 * データ読み込み中に表示されるプレースホルダー
 */
export default function TableSkeleton({
  rowCount = 10,
  columnCount = 8,
}: TableSkeletonProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* ヘッダー部分のスケルトン */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* テーブル部分のスケルトン */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 border-b border-gray-200 w-12">
                <div className="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
              </th>
              {Array.from({ length: columnCount }).map((_, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
                </td>
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`h-4 bg-gray-200 rounded animate-pulse ${
                        colIndex === 0
                          ? "w-32"
                          : colIndex === 1
                          ? "w-24"
                          : colIndex === 2
                          ? "w-20"
                          : "w-28"
                      }`}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

