import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const salesOpportunityUpdateSchema = z.object({
  companyId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  status: z.enum(["ESTIMATING", "WON", "LOST"]).optional(),
  estimatedAmount: z.string().optional(),
  craneCount: z.number().int().positive().optional(),
  craneInfo: z.string().optional(),
  occurredAt: z.string().optional(),
  notes: z.string().optional(),
});

// GET: 営業案件詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const salesOpportunity = await prisma.salesOpportunity.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            postalCode: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        quotes: {
          orderBy: {
            createdAt: "desc",
          },
        },
        contract: true,
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            quotes: true,
          },
        },
      },
    });

    if (!salesOpportunity) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(salesOpportunity);
  } catch (error) {
    console.error("営業案件詳細取得エラー:", error);
    return NextResponse.json(
      { error: "営業案件の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: 営業案件更新
export async function PATCH(
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

    const body = await request.json();
    const validatedData = salesOpportunityUpdateSchema.parse(body);

    const updateData: any = {};
    if (validatedData.companyId !== undefined)
      updateData.companyId = validatedData.companyId;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.estimatedAmount !== undefined)
      updateData.estimatedAmount = validatedData.estimatedAmount
        ? parseFloat(validatedData.estimatedAmount)
        : null;
    if (validatedData.craneCount !== undefined)
      updateData.craneCount = validatedData.craneCount;
    if (validatedData.craneInfo !== undefined)
      updateData.craneInfo = validatedData.craneInfo;
    if (validatedData.occurredAt !== undefined)
      updateData.occurredAt = validatedData.occurredAt
        ? new Date(validatedData.occurredAt)
        : null;
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes;

    const salesOpportunity = await prisma.salesOpportunity.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            postalCode: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        quotes: {
          orderBy: {
            createdAt: "desc",
          },
        },
        contract: true,
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            quotes: true,
          },
        },
      },
    });

    return NextResponse.json(salesOpportunity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("営業案件更新エラー:", error);
    return NextResponse.json(
      { error: "営業案件の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 営業案件削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 管理者のみ削除可能
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "この操作を実行する権限がありません" },
        { status: 403 }
      );
    }

    await prisma.salesOpportunity.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "営業案件を削除しました" });
  } catch (error) {
    console.error("営業案件削除エラー:", error);
    return NextResponse.json(
      { error: "営業案件の削除に失敗しました" },
      { status: 500 }
    );
  }
}

