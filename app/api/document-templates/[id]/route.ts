import { NextRequest, NextResponse } from "next/server";
import { getSession, requireEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET: テンプレートファイル取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: params.id,
        isActive: true,
        OR: [
          { userId: session.user.id }, // ユーザー専用テンプレート
          { isDefault: true }, // デフォルトテンプレート
        ],
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        fileData: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "テンプレートが見つかりません" },
        { status: 404 }
      );
    }

    // バイナリデータを返す（BufferをUint8Arrayに変換）
    return new NextResponse(new Uint8Array(template.fileData), {
      headers: {
        "Content-Type": template.mimeType,
        "Content-Disposition": `attachment; filename="${template.name}"`,
      },
    });
  } catch (error) {
    console.error("テンプレートファイル取得エラー:", error);
    return NextResponse.json(
      { error: "テンプレートファイルの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: テンプレート削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireEditor();

    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "テンプレートが見つかりません" },
        { status: 404 }
      );
    }

    // ユーザーが所有するテンプレートのみ削除可能（デフォルトテンプレートは管理者のみ）
    if (template.userId !== session.user.id && template.isDefault) {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "このテンプレートを削除する権限がありません" },
          { status: 403 }
        );
      }
    }

    // ソフトデリート（isActiveをfalseに）
    await prisma.documentTemplate.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "テンプレートを削除しました" });
  } catch (error) {
    console.error("テンプレート削除エラー:", error);
    return NextResponse.json(
      { error: "テンプレートの削除に失敗しました" },
      { status: 500 }
    );
  }
}
