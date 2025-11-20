import { NextRequest, NextResponse } from "next/server";
import { getSession, requireEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TemplateType } from "@prisma/client";

// GET: テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const templateType = searchParams.get("templateType") as TemplateType | null;

    // 現在のユーザーのテンプレートとデフォルトテンプレートを取得
    const templates = await prisma.documentTemplate.findMany({
      where: {
        isActive: true,
        ...(templateType && { templateType }),
        OR: [
          { userId: session.user.id }, // ユーザー専用テンプレート
          { isDefault: true }, // デフォルトテンプレート
        ],
      },
      select: {
        id: true,
        userId: true,
        templateType: true,
        name: true,
        description: true,
        fileSize: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isDefault: "desc" }, // デフォルトテンプレートを先に
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("テンプレート一覧取得エラー:", error);
    return NextResponse.json(
      { error: "テンプレート一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: テンプレートアップロード
export async function POST(request: NextRequest) {
  try {
    const session = await requireEditor();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const templateType = formData.get("templateType") as TemplateType | null;
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const isDefault = formData.get("isDefault") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが指定されていません" },
        { status: 400 }
      );
    }

    if (!templateType || !name) {
      return NextResponse.json(
        { error: "テンプレートタイプと名前は必須です" },
        { status: 400 }
      );
    }

    // ファイルサイズ制限（5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "ファイルサイズが大きすぎます（最大5MB）" },
        { status: 400 }
      );
    }

    // ファイルタイプの検証
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "サポートされていないファイル形式です（.docxまたは.xlsxのみ）" },
        { status: 400 }
      );
    }

    // ファイルをバッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // デフォルトテンプレートを設定する場合、既存のデフォルトを無効化
    if (isDefault) {
      await prisma.documentTemplate.updateMany({
        where: {
          templateType,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // テンプレートを保存
    const template = await prisma.documentTemplate.create({
      data: {
        userId: session.user.id,
        templateType,
        name,
        description: description || null,
        fileData: buffer,
        fileSize: file.size,
        mimeType: file.type,
        isActive: true,
        isDefault: isDefault || false,
      },
      select: {
        id: true,
        userId: true,
        templateType: true,
        name: true,
        description: true,
        fileSize: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("テンプレートアップロードエラー:", error);
    return NextResponse.json(
      { error: "テンプレートのアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
