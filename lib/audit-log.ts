import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";

/**
 * 変更履歴を記録する
 */
export async function createAuditLog(
  entityType: string,
  entityId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  changes: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    multipleChanges?: Array<{
      field: string;
      oldValue?: any;
      newValue?: any;
    }>;
  }
) {
  try {
    // ユーザー情報はオプショナル（一旦なし）
    const session = await getSession();
    const userId = session?.user?.id || null;

    const { field, oldValue, newValue, multipleChanges } = changes;

    if (multipleChanges && multipleChanges.length > 0) {
      // 複数フィールドの変更の場合
      await prisma.auditLog.create({
        data: {
          entityType,
          entityId,
          action,
          field: null, // 複数フィールド変更時はnull
          oldValue: null,
          newValue: null,
          changes: JSON.stringify(multipleChanges),
          userId: userId || undefined,
        },
      });
    } else {
      // 単一フィールドの変更の場合
      await prisma.auditLog.create({
        data: {
          entityType,
          entityId,
          action,
          field: field || null,
          oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
          newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
          changes: null,
          userId: userId || undefined,
        },
      });
    }
  } catch (error) {
    // 履歴記録のエラーはログに記録するが、処理は続行
    console.error("Audit log creation error:", error);
  }
}

/**
 * フィールド名を日本語に変換するマッピング
 */
const fieldNameMap: Record<string, Record<string, string>> = {
  Company: {
    name: "会社名",
    postalCode: "郵便番号",
    address: "住所",
    phone: "電話番号",
    email: "メールアドレス",
    industryType: "業種",
    billingFlag: "請求フラグ",
    notes: "備考",
  },
  SalesOpportunity: {
    title: "案件名",
    status: "ステージ",
    estimatedAmount: "売上の期待値",
    craneCount: "対象クレーン台数",
    craneInfo: "クレーン情報",
    occurredAt: "発生日",
    notes: "備考",
  },
  Project: {
    title: "プロジェクトタイトル",
    status: "ステータス",
    startDate: "開始日",
    endDate: "終了日",
    amount: "金額",
    notes: "備考",
  },
  Contact: {
    name: "氏名",
    position: "役職",
    phone: "電話番号",
    email: "メール",
    notes: "対応履歴メモ",
  },
  Equipment: {
    name: "機器名称",
    model: "機種・型式",
    serialNumber: "製造番号",
    location: "設置場所",
    specifications: "仕様情報",
    notes: "備考",
  },
  WorkRecord: {
    equipmentId: "機器",
    userId: "担当者",
    workType: "作業タイプ",
    inspectionDate: "作業日",
    overallJudgment: "総合判定",
    findings: "所見",
    summary: "要約",
    additionalNotes: "追加メモ",
    checklistData: "チェックリスト",
    photos: "写真",
  },
};

/**
 * フィールド名を日本語に変換
 */
export function getFieldDisplayName(entityType: string, fieldName: string): string {
  return fieldNameMap[entityType]?.[fieldName] || fieldName;
}

/**
 * 値を表示用にフォーマット
 */
export function formatValue(value: any, fieldName?: string): string {
  if (value === null || value === undefined) {
    return "空の値";
  }

  if (typeof value === "boolean") {
    return value ? "有効" : "無効";
  }

  // ステータス値のマッピング
  if (fieldName === "status") {
    const statusMap: Record<string, string> = {
      ESTIMATING: "見積中",
      WON: "受注",
      LOST: "失注",
      PLANNING: "計画中",
      IN_PROGRESS: "進行中",
      ON_HOLD: "保留",
      COMPLETED: "完了",
    };
    if (statusMap[value as string]) {
      return statusMap[value as string];
    }
  }

  if (fieldName === "billingFlag") {
    return value ? "有効" : "無効";
  }

  // 日付のフォーマット
  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    try {
      const date = typeof value === "string" ? new Date(value) : value;
      return date.toLocaleDateString("ja-JP");
    } catch {
      return String(value);
    }
  }

  // 数値のフォーマット（金額など）
  if (typeof value === "number") {
    if (fieldName === "estimatedAmount" || fieldName === "amount") {
      return `¥${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  }

  if (typeof value === "object") {
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
      return JSON.stringify(parsed);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

