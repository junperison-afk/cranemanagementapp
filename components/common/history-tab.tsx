"use client";

import { useState, useEffect } from "react";
import { PencilIcon, DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getFieldDisplayName, formatValue } from "@/lib/audit-log";

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  changes: string | null;
  userId: string | null;
  memo: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  dateDisplay?: string;
}

interface HistoryTabProps {
  entityType: string;
  entityId: string;
}

export default function HistoryTab({ entityType, entityId }: HistoryTabProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [entityType, entityId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/audit-logs?entityType=${entityType}&entityId=${entityId}`
      );
      if (!response.ok) {
        throw new Error("履歴の取得に失敗しました");
      }
      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
    } catch (error) {
      console.error("履歴取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-500">履歴がありません</p>
      </div>
    );
  }

  // 日付でグループ化
  const groupedByDate = auditLogs.reduce((acc, log) => {
    const date = new Date(log.createdAt);
    // 画像に合わせた日付フォーマット（例: "8月 12, 2025"）
    const dateStr = `${date.getMonth() + 1}月 ${date.getDate()}, ${date.getFullYear()}`;
    // 日付文字列を正規化（例: "2025/08/12"）
    const dateKey = new Date(log.createdAt).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push({ ...log, dateDisplay: dateStr });
    return acc;
  }, {} as Record<string, Array<AuditLog & { dateDisplay: string }>>);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
            <DocumentDuplicateIcon className="h-4 w-4 text-green-600" />
          </div>
        );
      case "UPDATE":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
            <PencilIcon className="h-4 w-4 text-blue-600" />
          </div>
        );
      case "DELETE":
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
            <TrashIcon className="h-4 w-4 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
            <PencilIcon className="h-4 w-4 text-gray-600" />
          </div>
        );
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "CREATE":
        return "作成しました";
      case "UPDATE":
        return "更新されました";
      case "DELETE":
        return "削除されました";
      default:
        return "変更されました";
    }
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ステータス値などをタグとして表示
  const renderValueWithTag = (value: string, fieldName?: string | null) => {
    if (fieldName === "status") {
      // ステータス値の色分け
      const statusColorMap: Record<string, string> = {
        見積中: "bg-yellow-100 text-yellow-800",
        受注: "bg-green-100 text-green-800",
        失注: "bg-red-100 text-red-800",
        計画中: "bg-gray-100 text-gray-800",
        進行中: "bg-blue-100 text-blue-800",
        保留: "bg-yellow-100 text-yellow-800",
        完了: "bg-green-100 text-green-800",
      };
      const colorClass = statusColorMap[value] || "bg-gray-100 text-gray-800";
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          {value}
        </span>
      );
    }
    return <strong>{value}</strong>;
  };

  const renderChange = (log: AuditLog) => {
    if (log.action === "CREATE") {
      return <p className="text-sm text-gray-900">{entityType === "Company" ? "取引先" : "レコード"}作成しました</p>;
    }

    if (log.changes) {
      // 複数フィールドの変更
      try {
        const changes = JSON.parse(log.changes) as Array<{
          field: string;
          oldValue?: any;
          newValue?: any;
        }>;
        return (
          <div className="space-y-1">
            {changes.map((change, index) => (
              <p key={index} className="text-sm text-gray-900">
                {getFieldDisplayName(entityType, change.field)}が更新されました 次から: <strong>{formatValue(change.oldValue, change.field)}</strong> - {renderValueWithTag(formatValue(change.newValue, change.field), change.field)}
              </p>
            ))}
          </div>
        );
      } catch (error) {
        return <p className="text-sm text-gray-900">複数のフィールドが更新されました</p>;
      }
    } else if (log.field) {
      // 単一フィールドの変更
      let oldVal: any = null;
      let newVal: any = null;
      try {
        oldVal = log.oldValue ? JSON.parse(log.oldValue) : null;
        newVal = log.newValue ? JSON.parse(log.newValue) : null;
      } catch (error) {
        oldVal = log.oldValue;
        newVal = log.newValue;
      }

      return (
        <p className="text-sm text-gray-900">
          {getFieldDisplayName(entityType, log.field)}が更新されました 次から: <strong>{formatValue(oldVal, log.field)}</strong> - {renderValueWithTag(formatValue(newVal, log.field), log.field)}
        </p>
      );
    }

    return <p className="text-sm text-gray-900">{getActionText(log.action)}</p>;
  };

  // 日付でソート（新しい順）
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const logs = groupedByDate[dateKey].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        const dateDisplay = logs[0]?.dateDisplay || dateKey;

        return (
          <div key={dateKey} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            {/* 日付ヘッダー */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                {dateDisplay}
              </span>
            </div>

            {/* 履歴アイテム */}
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="flex gap-4">
                  {/* タイムライン */}
                  <div className="flex flex-col items-center relative">
                    {getActionIcon(log.action)}
                    {index < logs.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 mt-2 min-h-[80px] absolute top-6"></div>
                    )}
                  </div>

                  {/* コンテンツ */}
                  <div className="flex-1 min-w-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="mb-2">
                      {renderChange(log)}
                    </div>
                    {log.user && (
                      <p className="text-xs text-gray-500">
                        実行者 {log.user.name || log.user.email} {formatDateTime(log.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

