import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inspectionRecordUpdateSchema = z.object({
  equipmentId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  workType: z.enum(["INSPECTION", "REPAIR", "MAINTENANCE", "OTHER"]).optional(),
  inspectionDate: z.string().optional(),
  overallJudgment: z.enum(["GOOD", "CAUTION", "BAD", "REPAIR"]).optional(),
  findings: z.string().optional(),
  summary: z.string().optional(),
  additionalNotes: z.string().optional(),
  checklistData: z.string().optional(),
  photos: z.string().optional(),
});

// GET: 作業記録詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const inspectionRecord = await prisma.inspectionRecord.findUnique({
      where: { id: params.id },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            location: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!inspectionRecord) {
      return NextResponse.json(
        { error: "作業記録が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(inspectionRecord);
  } catch (error) {
    console.error("作業記録詳細取得エラー:", error);
    return NextResponse.json(
      { error: "作業記録の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: 作業記録更新
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
    const validatedData = inspectionRecordUpdateSchema.parse(body);

    const updateData: any = {};
    if (validatedData.equipmentId !== undefined)
      updateData.equipmentId = validatedData.equipmentId;
    if (validatedData.userId !== undefined)
      updateData.userId = validatedData.userId;
    if (validatedData.workType !== undefined)
      updateData.workType = validatedData.workType;
    if (validatedData.inspectionDate !== undefined)
      updateData.inspectionDate = new Date(validatedData.inspectionDate);
    if (validatedData.overallJudgment !== undefined)
      updateData.overallJudgment = validatedData.overallJudgment || null;
    if (validatedData.findings !== undefined)
      updateData.findings = validatedData.findings;
    if (validatedData.summary !== undefined)
      updateData.summary = validatedData.summary;
    if (validatedData.additionalNotes !== undefined)
      updateData.additionalNotes = validatedData.additionalNotes;
    if (validatedData.checklistData !== undefined)
      updateData.checklistData = validatedData.checklistData;
    if (validatedData.photos !== undefined) updateData.photos = validatedData.photos;

    const inspectionRecord = await prisma.inspectionRecord.update({
      where: { id: params.id },
      data: updateData,
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            location: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(inspectionRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("作業記録更新エラー:", error);
    return NextResponse.json(
      { error: "作業記録の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 作業記録削除
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

    await prisma.inspectionRecord.delete({
      where: { id: params.id },
    });

      return NextResponse.json({ message: "作業記録を削除しました" });
  } catch (error) {
    console.error("作業記録削除エラー:", error);
    return NextResponse.json(
      { error: "作業記録の削除に失敗しました" },
      { status: 500 }
    );
  }
}

