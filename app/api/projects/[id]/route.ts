import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const projectUpdateSchema = z.object({
  companyId: z.string().min(1).optional(),
  salesOpportunityId: z.string().optional(),
  assignedUserId: z.string().optional(),
  title: z.string().min(1).optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.string().optional(),
  notes: z.string().optional(),
});

// GET: プロジェクト詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        salesOpportunity: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        equipment: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("プロジェクト詳細取得エラー:", error);
    return NextResponse.json(
      { error: "プロジェクトの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: プロジェクト更新
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
    const validatedData = projectUpdateSchema.parse(body);

    // 既存データを取得（変更前の値を記録するため）
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.companyId !== undefined)
      updateData.companyId = validatedData.companyId;
    if (validatedData.salesOpportunityId !== undefined)
      updateData.salesOpportunityId =
        validatedData.salesOpportunityId || null;
    if (validatedData.assignedUserId !== undefined)
      updateData.assignedUserId = validatedData.assignedUserId || null;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.startDate !== undefined)
      updateData.startDate = validatedData.startDate
        ? new Date(validatedData.startDate)
        : null;
    if (validatedData.endDate !== undefined)
      updateData.endDate = validatedData.endDate
        ? new Date(validatedData.endDate)
        : null;
    if (validatedData.amount !== undefined)
      updateData.amount = validatedData.amount
        ? parseFloat(validatedData.amount)
        : null;
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes;

    // 変更されたフィールドを特定
    const changes: Array<{
      field: string;
      oldValue?: any;
      newValue?: any;
    }> = [];

    Object.keys(updateData).forEach((key) => {
      const oldValue = existingProject[key as keyof typeof existingProject];
      const newValue = updateData[key];

      if (oldValue !== newValue) {
        changes.push({
          field: key,
          oldValue,
          newValue,
        });
      }
    });

    const project = await prisma.project.update({
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        salesOpportunity: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        equipment: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    });

    // 変更履歴を記録
    if (changes.length > 0) {
      if (changes.length === 1) {
        await createAuditLog("Project", params.id, "UPDATE", {
          field: changes[0].field,
          oldValue: changes[0].oldValue,
          newValue: changes[0].newValue,
        });
      } else {
        await createAuditLog("Project", params.id, "UPDATE", {
          multipleChanges: changes,
        });
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("プロジェクト更新エラー:", error);
    return NextResponse.json(
      { error: "プロジェクトの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: プロジェクト削除
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

    // 削除前に履歴を記録
    await createAuditLog("Project", params.id, "DELETE", {
      newValue: { deleted: true },
    });

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "プロジェクトを削除しました" });
  } catch (error) {
    console.error("プロジェクト削除エラー:", error);
    return NextResponse.json(
      { error: "プロジェクトの削除に失敗しました" },
      { status: 500 }
    );
  }
}

