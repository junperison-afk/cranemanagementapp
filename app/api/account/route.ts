import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * ユーザー情報を取得
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("ユーザー情報取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * ユーザー情報を更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    // メールアドレスの重複チェック（他のユーザーが使用していないか）
    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name !== undefined ? (name || null) : undefined,
        email: email || undefined,
        phone: phone !== undefined ? (phone || null) : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "ユーザー情報を更新しました",
    });
  } catch (error) {
    console.error("ユーザー情報更新エラー:", error);
    return NextResponse.json(
      { error: "ユーザー情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}

