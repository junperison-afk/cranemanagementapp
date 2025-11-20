import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import { z } from "zod";

// 見積明細のバリデーションスキーマ
const quoteItemSchema = z.object({
  itemNumber: z.number().int().positive(),
  description: z.string().min(1, "明細内容は必須です"),
  quantity: z.number().int().nonnegative().nullable().optional(), // 0以上を許可
  unitPrice: z.number().int().nonnegative().nullable().optional(), // 0以上を許可
  amount: z.number().int().positive("金額は1以上の整数である必要があります"),
  notes: z.string().nullable().optional(),
});

// 見積のバリデーションスキーマ
const quoteSchema = z.object({
  amount: z.string().min(1, "金額は必須です"),
  items: z.array(quoteItemSchema).min(1, "少なくとも1つの明細が必要です"),
  conditions: z.string().optional().or(z.null()),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]).optional(),
  validUntil: z.string().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
});

/**
 * 見積番号を自動採番（Q-YYYYMM-XXXX形式）
 * 例: Q-202411-0001
 */
async function generateQuoteNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `Q-${year}${month}`;

  // 当月の見積番号の最大値を取得
  const lastQuote = await prisma.salesQuote.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: "desc",
    },
  });

  let sequence = 1;
  if (lastQuote) {
    // 最後の見積番号から連番を抽出（例: Q-202411-0001 → 1）
    const lastSequence = parseInt(lastQuote.quoteNumber.split("-")[2] || "0", 10);
    sequence = lastSequence + 1;
  }

  // 4桁の連番にフォーマット（例: 0001）
  const sequenceStr = sequence.toString().padStart(4, "0");
  return `${prefix}-${sequenceStr}`;
}

// POST: 見積データ作成
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
    
    // バリデーション前にデバッグログを追加
    console.log("受信データ:", JSON.stringify(body, null, 2));
    
    let validatedData;
    try {
      validatedData = quoteSchema.parse(body);
    } catch (validationError) {
      console.error("バリデーションエラー:", validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "バリデーションエラー", 
            details: validationError.errors,
            receivedData: body,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // 見積番号を自動採番
    const quoteNumber = await generateQuoteNumber();

    // 見積データを作成（明細を含む）
    const quote = await prisma.salesQuote.create({
      data: {
        salesOpportunityId: params.id,
        quoteNumber,
        amount: Math.round(parseFloat(validatedData.amount)),
        conditions: validatedData.conditions || null,
        status: validatedData.status || "DRAFT",
        validUntil: validatedData.validUntil
          ? new Date(validatedData.validUntil)
          : null,
        notes: validatedData.notes || null,
        // 見積明細を作成
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
        items: {
          orderBy: {
            itemNumber: "asc",
          },
        },
      },
    });

    // Decimal型をnumber型に変換
    return NextResponse.json({
      ...quote,
      amount: quote.amount.toNumber(),
      items: quote.items.map((item) => ({
        ...item,
        quantity: item.quantity?.toNumber() ?? null,
        unitPrice: item.unitPrice?.toNumber() ?? null,
        amount: item.amount.toNumber(),
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("バリデーションエラー:", error.errors);
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }

    console.error("見積作成エラー:", error);
    const errorMessage = error instanceof Error ? error.message : "見積の作成に失敗しました";
    return NextResponse.json(
      { 
        error: "見積の作成に失敗しました",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

