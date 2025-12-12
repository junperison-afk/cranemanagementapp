"use client";

interface TimelineEvent {
  id: string;
  type: "company" | "sales_opportunity" | "project_start" | "project_end";
  date: Date;
  label: string;
  description?: string;
}

interface CompanyTimelineProps {
  companyCreatedAt: Date;
  salesOpportunities: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
  projects: Array<{
    id: string;
    title: string;
    startDate: Date | null;
    endDate: Date | null;
  }>;
}

/**
 * 取引先タイムラインコンポーネント
 */
export default function CompanyTimeline({
  companyCreatedAt,
  salesOpportunities,
  projects,
}: CompanyTimelineProps) {
  // タイムラインイベントを生成
  const events: TimelineEvent[] = [];

  // 会社登録日
  events.push({
    id: "company",
    type: "company",
    date: new Date(companyCreatedAt),
    label: "登録",
    description: "取引先登録",
  });

  // 営業案件の登録日
  salesOpportunities.forEach((so) => {
    events.push({
      id: `sales_opportunity_${so.id}`,
      type: "sales_opportunity",
      date: new Date(so.createdAt),
      label: "営業案件登録",
      description: so.title,
    });
  });

  // プロジェクトの開始日と終了日
  projects.forEach((project) => {
    if (project.startDate) {
      events.push({
        id: `project_start_${project.id}`,
        type: "project_start",
        date: new Date(project.startDate),
        label: "プロジェクト開始",
        description: project.title,
      });
    }
    if (project.endDate) {
      events.push({
        id: `project_end_${project.id}`,
        type: "project_end",
        date: new Date(project.endDate),
        label: "プロジェクト終了",
        description: project.title,
      });
    }
  });

  // 日付順にソート
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) {
    return null;
  }

  // 等間隔で配置（重なりを防ぐ）
  // 各イベントの位置を計算（パーセンテージ）
  const getPosition = (index: number) => {
    if (events.length === 1) return 50; // 1つの場合は中央
    // 最初と最後に余白を持たせて等間隔配置
    const padding = 5; // 左右の余白（%）
    const availableWidth = 100 - padding * 2;
    return padding + (availableWidth / (events.length - 1)) * index;
  };

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "company":
        return "bg-blue-500";
      case "sales_opportunity":
        return "bg-green-500";
      case "project_start":
        return "bg-yellow-500";
      case "project_end":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "company":
        return "📋";
      case "sales_opportunity":
        return "💼";
      case "project_start":
        return "🚀";
      case "project_end":
        return "✅";
      default:
        return "●";
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">タイムライン</h2>
      <div className="relative overflow-x-auto">
        {/* タイムラインの線 */}
        <div className="relative min-h-[180px]">
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-gray-300" />

          {/* イベント */}
          <div className="relative">
            {events.map((event, index) => {
              const position = getPosition(index);
              return (
                <div
                  key={event.id}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${position}%`, transform: "translateX(-50%)", minWidth: "120px" }}
                >
                  {/* 日付 */}
                  <div className="mb-2 text-center">
                    <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
                      {event.date.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {/* イベントマーカー */}
                  <div className="relative z-10 mb-2">
                    <div
                      className={`w-5 h-5 rounded-full ${getEventColor(
                        event.type
                      )} border-2 border-white shadow-md flex items-center justify-center`}
                    >
                      <span className="text-xs text-white">{getEventIcon(event.type)}</span>
                    </div>
                    {/* 下向き三角矢印 */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0.5">
                      <svg
                        className="w-3 h-3 text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                      >
                        <path d="M6 9L1 4h10L6 9z" />
                      </svg>
                    </div>
                  </div>

                  {/* イベント情報 */}
                  <div className="mt-2 w-32 text-center">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {event.label}
                    </div>
                    {event.description && (
                      <div 
                        className="text-xs text-gray-500 line-clamp-2 px-1" 
                        title={event.description}
                      >
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

