import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

// 受注明細のバリデーションスキーマ
const contractItemSchema = z.object({
  id: z.string().optional(), // 既存の明細のID（更新時）
  itemNumber: z.number().int().positive(),
  description: z.string().min(1, "明細内容は必須です"),
  quantity: z.number().int().nonnegative().nullable().optional(),
  unitPrice: z.number().int().nonnegative().nullable().optional(),
  amount: z.number().int().positive("金額は1以上の整数である必要があります"),
  notes: z.string().nullable().optional(),
});

// 受注書更新のバリデーションスキーマ
const contractUpdateSchema = z.object({
  items: z.array(contractItemSchema).min(1, "少なくとも1つの明細が必要です"),
  contractDate: z.string().min(1, "契約日は必須です"),
  conditions: z.string().optional().or(z.null()),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  amount: z.number().int().positive().optional(),
});

// GET: 受注書詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.contractId },
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "受注書が見つかりません" },
        { status: 404 }
      );
    }

    // 営業案件IDが一致するか確認
    if (contract.salesOpportunityId !== params.id) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

    // Decimal型をnumber型に変換
    return NextResponse.json({
      ...contract,
      amount: contract.amount.toNumber(),
      items: contract.items.map((item) => ({
        ...item,
        quantity: item.quantity?.toNumber() ?? null,
        unitPrice: item.unitPrice?.toNumber() ?? null,
        amount: item.amount.toNumber(),
      })),
      createdBy: contract.createdBy,
    });
  } catch (error) {
    console.error("受注書詳細取得エラー:", error);
    return NextResponse.json(
      { error: "受注書の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: 受注書更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
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

    const body = await request.json();
    let validatedData;
    try {
      validatedData = contractUpdateSchema.parse(body);
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

    // 既存の受注書を取得
    const existingContract = await prisma.contract.findUnique({
      where: { id: params.contractId },
      include: {
        items: true,
      },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: "受注書が見つかりません" },
        { status: 404 }
      );
    }

    // 営業案件IDが一致するか確認
    if (existingContract.salesOpportunityId !== params.id) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

    // 合計金額を計算
    const totalAmount = validatedData.amount || validatedData.items.reduce((sum, item) => {
      return sum + item.amount;
    }, 0);

    // トランザクションで更新
    const updatedContract = await prisma.$transaction(async (tx) => {
      // 既存の明細を削除
      await tx.contractItem.deleteMany({
        where: { contractId: params.contractId },
      });

      // 受注書を更新
      const contract = await tx.contract.update({
        where: { id: params.contractId },
        data: {
          contractDate: new Date(validatedData.contractDate),
          amount: totalAmount,
          conditions: validatedData.conditions || null,
          status: validatedData.status || "DRAFT",
        },
        include: {
          items: {
            orderBy: {
              itemNumber: "asc",
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // 新しい明細を作成
      await tx.contractItem.createMany({
        data: validatedData.items.map((item) => ({
          contractId: params.contractId,
          itemNumber: item.itemNumber,
          description: item.description,
          quantity: item.quantity !== null && item.quantity !== undefined
            ? item.quantity
            : null,
          unitPrice: item.unitPrice !== null && item.unitPrice !== undefined
            ? item.unitPrice
            : null,
          amount: item.amount,
          notes: item.notes && item.notes.trim() !== "" ? item.notes : null,
        })),
      });

      // 更新後のデータを取得
      return await tx.contract.findUnique({
        where: { id: params.contractId },
        include: {
          items: {
            orderBy: {
              itemNumber: "asc",
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    if (!updatedContract) {
      return NextResponse.json(
        { error: "受注書の更新に失敗しました" },
        { status: 500 }
      );
    }

    // 変更履歴を記録
    await createAuditLog("Contract", updatedContract.id, "UPDATE", {
      newValue: {
        salesOpportunityId: params.id,
        contractNumber: updatedContract.contractNumber,
      },
    });

    // Decimal型をnumber型に変換
    return NextResponse.json({
      ...updatedContract,
      amount: updatedContract.amount.toNumber(),
      items: updatedContract.items.map((item) => ({
        ...item,
        quantity: item.quantity?.toNumber() ?? null,
        unitPrice: item.unitPrice?.toNumber() ?? null,
        amount: item.amount.toNumber(),
      })),
    });
  } catch (error) {
    console.error("受注書更新エラー:", error);
    return NextResponse.json(
      { error: "受注書の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 受注書削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
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

    // 受注書の存在確認
    const existingContract = await prisma.contract.findUnique({
      where: { id: params.contractId },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: "受注書が見つかりません" },
        { status: 404 }
      );
    }

    // 営業案件IDが一致するか確認
    if (existingContract.salesOpportunityId !== params.id) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

    // 変更履歴を記録
    await createAuditLog("Contract", params.contractId, "DELETE", {
      newValue: { deleted: true },
    });

    // 受注書を削除（明細も自動削除される）
    await prisma.contract.delete({
      where: { id: params.contractId },
    });

    return NextResponse.json({ message: "受注書を削除しました" });
  } catch (error) {
    console.error("受注書削除エラー:", error);
    return NextResponse.json(
      { error: "受注書の削除に失敗しました" },
      { status: 500 }
    );
  }
}

