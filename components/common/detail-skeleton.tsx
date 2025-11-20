/**
 * 詳細画面のスケルトンUIコンポーネント
 * データ読み込み中に表示されるプレースホルダー
 */
export default function DetailSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー部分のスケルトン */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* コンテンツ部分のスケルトン */}
      <div className="flex-1 space-y-6">
        {/* 基本情報カード */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 関連情報カード */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

