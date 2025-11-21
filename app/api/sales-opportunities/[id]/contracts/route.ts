import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

// 受注明細のバリデーションスキーマ
const contractItemSchema = z.object({
  itemNumber: z.number().int().positive(),
  description: z.string().min(1, "明細内容は必須です"),
  quantity: z.number().int().nonnegative().nullable().optional(),
  unitPrice: z.number().int().nonnegative().nullable().optional(),
  amount: z.number().int().positive("金額は1以上の整数である必要があります"),
  notes: z.string().nullable().optional(),
});

// 受注書のバリデーションスキーマ
const contractSchema = z.object({
  salesQuoteId: z.string().optional().or(z.null()),
  amount: z.string().min(1, "金額は必須です"),
  items: z.array(contractItemSchema).min(1, "少なくとも1つの明細が必要です"),
  // contractNumberは自動採番のため、スキーマから削除
  contractDate: z.string().min(1, "契約日は必須です"),
  conditions: z.string().optional().or(z.null()),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
});

/**
 * 契約番号を自動採番（C-YYYYMM-XXXX形式）
 * 例: C-202411-0001
 */
async function generateContractNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `C-${year}${month}`;

  // 当月の契約番号の最大値を取得
  const lastContract = await prisma.contract.findFirst({
    where: {
      contractNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      contractNumber: "desc",
    },
  });

  let sequence = 1;
  if (lastContract) {
    // 最後の契約番号から連番を抽出（例: C-202411-0001 → 1）
    const lastSequence = parseInt(lastContract.contractNumber.split("-")[2] || "0", 10);
    sequence = lastSequence + 1;
  }

  // 4桁の連番にフォーマット（例: 0001）
  const sequenceStr = sequence.toString().padStart(4, "0");
  return `${prefix}-${sequenceStr}`;
}

// POST: 受注書作成
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 編集者以上の権限が必要
    if (session.user.role === "VIEWER") {
      return NextResponse.json(
        { error: "この操作を実行する権限がありません" },
        { status: 403 }
      );
    }

    // 営業案件の存在確認
    const salesOpportunity = await prisma.salesOpportunity.findUnique({
      where: { id: params.id },
    });

    if (!salesOpportunity) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = contractSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "バリデーションエラー",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // 見積が指定されている場合、その見積がこの営業案件に紐づいているか確認
    if (validatedData.salesQuoteId) {
      const quote = await prisma.salesQuote.findUnique({
        where: { id: validatedData.salesQuoteId },
      });

      if (!quote) {
        return NextResponse.json(
          { error: "指定された見積が見つかりません" },
          { status: 404 }
        );
      }

      if (quote.salesOpportunityId !== params.id) {
        return NextResponse.json(
          { error: "指定された見積はこの営業案件に紐づいていません" },
          { status: 400 }
        );
      }
    }

    // 受注書データを作成（明細を含む）
    // 契約番号はデータベース側のトリガーで自動採番されるため、指定しない
    const contract = await prisma.contract.create({
      data: {
        salesOpportunityId: params.id,
        salesQuoteId: validatedData.salesQuoteId || null,
        // contractNumberはデータベース側で自動採番（トリガーで生成）
        contractDate: new Date(validatedData.contractDate),
        amount: Math.round(parseFloat(validatedData.amount)),
        conditions: validatedData.conditions || null,
        status: validatedData.status || "DRAFT", // デフォルトで下書き
        createdById: session.user.id, // 作成者IDを保存
        // 受注明細を作成
        items: {
          create: validatedData.items.map((item) => ({
            itemNumber: item.itemNumber,
            description: item.description,
            quantity: item.quantity !== null && item.quantity !== undefined
              ? Math.round(item.quantity)
              : null,
            unitPrice: item.unitPrice !== null && item.unitPrice !== undefined
              ? Math.round(item.unitPrice)
              : null,
            amount: Math.round(item.amount),
            notes: item.notes && item.notes.trim() !== "" ? item.notes : null,
          })),
        },
      },
      include: {
        salesOpportunity: {
          select: {
            id: true,
            title: true,
          },
        },
        salesQuote: {
          select: {
            id: true,
            quoteNumber: true,
          },
        },
        items: {
          orderBy: {
            itemNumber: "asc",
          },
        },
      },
    });

    // Decimal型をnumber型に変換
    const contractWithNumberAmount = {
      ...contract,
      amount: contract.amount.toNumber(),
      items: contract.items.map((item) => ({
        ...item,
        quantity: item.quantity?.toNumber() ?? null,
        unitPrice: item.unitPrice?.toNumber() ?? null,
        amount: item.amount.toNumber(),
      })),
    };

    // 変更履歴を記録
    await createAuditLog("Contract", contract.id, "CREATE", {
      salesOpportunityId: params.id,
      contractNumber: contract.contractNumber,
    });

    return NextResponse.json(contractWithNumberAmount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("バリデーションエラー:", error.errors);
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }

    console.error("受注書作成エラー:", error);
    const errorMessage = error instanceof Error ? error.message : "受注書の作成に失敗しました";
    
    // Prismaエラーの詳細を取得
    let detailedError = errorMessage;
    let errorCode = null;
    
    if (error instanceof Error) {
      // Prismaエラーの場合、より詳細な情報を取得
      const errorString = error.toString();
      console.error("エラー詳細:", errorString);
      
      // ユニーク制約エラーの場合
      if (errorString.includes("Unique constraint") || errorString.includes("unique constraint") || errorString.includes("UniqueConstraintViolation")) {
        detailedError = "この営業案件には既に受注書が登録されているか、契約番号が重複しています。";
        errorCode = "UNIQUE_CONSTRAINT";
      }
      // 外部キー制約エラーの場合
      else if (errorString.includes("Foreign key constraint") || errorString.includes("foreign key") || errorString.includes("ForeignKeyConstraintViolation")) {
        detailedError = "関連データが見つかりません。ユーザーIDが無効な可能性があります。";
        errorCode = "FOREIGN_KEY";
      }
      // カラムが存在しないエラーの場合
      else if (errorString.includes("does not exist") || errorString.includes("column") || errorString.includes("Unknown column")) {
        detailedError = "データベーススキーマが最新ではありません。マイグレーションを実行してください。";
        errorCode = "SCHEMA_MISMATCH";
      }
      // 値が長すぎるエラーの場合
      else if (errorString.includes("too long") || errorString.includes("value for the column")) {
        detailedError = "入力値が長すぎます。";
        errorCode = "VALUE_TOO_LONG";
      }
    }
    
    return NextResponse.json(
      {
        error: "受注書の作成に失敗しました",
        details: detailedError,
        originalError: errorMessage,
        errorCode: errorCode,
        fullError: process.env.NODE_ENV === "development" ? error?.toString() : undefined,
      },
      { status: 500 }
    );
  }
}

