import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import { z } from "zod";

// 見積明細のバリデーションスキーマ
const quoteItemSchema = z.object({
  id: z.string().optional(), // 既存の明細のID（更新時）
  itemNumber: z.number().int().positive(),
  description: z.string().min(1, "明細内容は必須です"),
  quantity: z.number().int().nonnegative().nullable().optional(),
  unitPrice: z.number().int().nonnegative().nullable().optional(),
  amount: z.number().int().positive("金額は1以上の整数である必要があります"),
  notes: z.string().nullable().optional(),
});

// 見積更新のバリデーションスキーマ
const quoteUpdateSchema = z.object({
  items: z.array(quoteItemSchema).min(1, "少なくとも1つの明細が必要です"),
  conditions: z.string().optional().or(z.null()),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]).optional(),
  validUntil: z.string().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
});

// GET: 見積詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const quote = await prisma.salesQuote.findUnique({
      where: { id: params.quoteId },
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

    if (!quote) {
      return NextResponse.json(
        { error: "見積が見つかりません" },
        { status: 404 }
      );
    }

    // 営業案件IDが一致するか確認
    if (quote.salesOpportunityId !== params.id) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

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
    console.error("見積詳細取得エラー:", error);
    return NextResponse.json(
      { error: "見積の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: 見積更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
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

    // 見積の存在確認
    const existingQuote = await prisma.salesQuote.findUnique({
      where: { id: params.quoteId },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "見積が見つかりません" },
        { status: 404 }
      );
    }

    // 営業案件IDが一致するか確認
    if (existingQuote.salesOpportunityId !== params.id) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = quoteUpdateSchema.parse(body);
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

    // 明細の合計金額を計算
    const calculatedTotal = validatedData.items.reduce((sum, item) => {
      return sum + Math.round(item.amount);
    }, 0);

    // 見積データを更新（明細を含む）
    // 既存の明細をすべて削除してから新しい明細を作成
    await prisma.salesQuoteItem.deleteMany({
      where: { salesQuoteId: params.quoteId },
    });

    const quote = await prisma.salesQuote.update({
      where: { id: params.quoteId },
      data: {
        amount: calculatedTotal,
        conditions: validatedData.conditions || null,
        status: validatedData.status || existingQuote.status,
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

    console.error("見積更新エラー:", error);
    const errorMessage = error instanceof Error ? error.message : "見積の更新に失敗しました";
    return NextResponse.json(
      {
        error: "見積の更新に失敗しました",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

