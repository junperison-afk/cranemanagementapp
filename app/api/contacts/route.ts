import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const contactSchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  name: z.string().min(1, "氏名は必須です"),
  position: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  notes: z.string().optional(),
});

// GET: 連絡先一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const companyId = searchParams.get("companyId");
    const position = searchParams.get("position");
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");
    const updatedAfter = searchParams.get("updatedAfter");
    const updatedBefore = searchParams.get("updatedBefore");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const whereConditions: any[] = [];

    // 検索条件
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search } },
          { position: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
          { notes: { contains: search } },
          { company: { name: { contains: search } } },
        ],
      });
    }

    // 取引先フィルター
    if (companyId) {
      whereConditions.push({
        companyId: companyId,
      });
    }

    // 役職フィルター
    if (position) {
      whereConditions.push({
        position: { contains: position },
      });
    }

    // 電話番号フィルター
    if (phone) {
      whereConditions.push({
        phone: { contains: phone },
      });
    }

    // メールフィルター
    if (email) {
      whereConditions.push({
        email: { contains: email },
      });
    }

    // 更新日時フィルター
    if (updatedAfter) {
      whereConditions.push({
        updatedAt: { gte: new Date(updatedAfter) },
      });
    }

    if (updatedBefore) {
      whereConditions.push({
        updatedAt: { lte: new Date(updatedBefore) },
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [contacts, total] = await Promise.all([
      prisma.companyContact.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.companyContact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("連絡先一覧取得エラー:", error);
    return NextResponse.json(
      { error: "連絡先一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 連絡先作成
export async function POST(request: NextRequest) {
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
    const validatedData = contactSchema.parse(body);

    const contact = await prisma.companyContact.create({
      data: {
        companyId: validatedData.companyId,
        name: validatedData.name,
        position: validatedData.position,
        phone: validatedData.phone,
        email: validatedData.email || null,
        notes: validatedData.notes,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 作成履歴を記録
    await createAuditLog("Contact", contact.id, "CREATE", {
      newValue: contact,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("連絡先作成エラー:", error);
    return NextResponse.json(
      { error: "連絡先の作成に失敗しました" },
      { status: 500 }
    );
  }
}

