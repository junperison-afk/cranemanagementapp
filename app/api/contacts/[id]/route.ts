import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactUpdateSchema = z.object({
  companyId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  notes: z.string().optional(),
});

// GET: 連絡先詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const contact = await prisma.companyContact.findUnique({
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
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "連絡先が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("連絡先詳細取得エラー:", error);
    return NextResponse.json(
      { error: "連絡先の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH: 連絡先更新
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
    const validatedData = contactUpdateSchema.parse(body);

    const updateData: any = {};
    if (validatedData.companyId !== undefined)
      updateData.companyId = validatedData.companyId;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.position !== undefined)
      updateData.position = validatedData.position;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const contact = await prisma.companyContact.update({
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
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("連絡先更新エラー:", error);
    return NextResponse.json(
      { error: "連絡先の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 連絡先削除
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

    await prisma.companyContact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "連絡先を削除しました" });
  } catch (error) {
    console.error("連絡先削除エラー:", error);
    return NextResponse.json(
      { error: "連絡先の削除に失敗しました" },
      { status: 500 }
    );
  }
}

