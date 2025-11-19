import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const equipmentUpdateSchema = z.object({
  companyId: z.string().min(1).optional(),
  projectId: z.string().optional(),
  name: z.string().min(1).optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  specifications: z.string().optional(),
  notes: z.string().optional(),
});

// GET: 機器詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const equipment = await prisma.equipment.findUnique({
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
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        inspectionRecords: {
          take: 10,
          orderBy: {
            inspectionDate: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            inspectionRecords: true,
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "機器が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("機器詳細取得エラー:", error);
    return NextResponse.json(
      { error: "機器の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: 機器更新
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
    const validatedData = equipmentUpdateSchema.parse(body);

    // 既存データを取得（変更前の値を記録するため）
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: params.id },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "機器が見つかりません" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.companyId !== undefined)
      updateData.companyId = validatedData.companyId;
    if (validatedData.projectId !== undefined)
      updateData.projectId = validatedData.projectId || null;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.model !== undefined)
      updateData.model = validatedData.model;
    if (validatedData.serialNumber !== undefined)
      updateData.serialNumber = validatedData.serialNumber;
    if (validatedData.location !== undefined)
      updateData.location = validatedData.location;
    if (validatedData.specifications !== undefined)
      updateData.specifications = validatedData.specifications;
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes;

    // 変更されたフィールドを特定
    const changes: Array<{
      field: string;
      oldValue?: any;
      newValue?: any;
    }> = [];

    Object.keys(updateData).forEach((key) => {
      const oldValue = existingEquipment[key as keyof typeof existingEquipment];
      const newValue = updateData[key];

      if (oldValue !== newValue) {
        changes.push({
          field: key,
          oldValue,
          newValue,
        });
      }
    });

    const equipment = await prisma.equipment.update({
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
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        inspectionRecords: {
          take: 10,
          orderBy: {
            inspectionDate: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            inspectionRecords: true,
          },
        },
      },
    });

    // 変更履歴を記録
    if (changes.length > 0) {
      if (changes.length === 1) {
        await createAuditLog("Equipment", params.id, "UPDATE", {
          field: changes[0].field,
          oldValue: changes[0].oldValue,
          newValue: changes[0].newValue,
        });
      } else {
        await createAuditLog("Equipment", params.id, "UPDATE", {
          multipleChanges: changes,
        });
      }
    }

    return NextResponse.json(equipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("機器更新エラー:", error);
    return NextResponse.json(
      { error: "機器の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 機器削除
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
    await createAuditLog("Equipment", params.id, "DELETE", {
      newValue: { deleted: true },
    });

    await prisma.equipment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "機器を削除しました" });
  } catch (error) {
    console.error("機器削除エラー:", error);
    return NextResponse.json(
      { error: "機器の削除に失敗しました" },
      { status: 500 }
    );
  }
}

