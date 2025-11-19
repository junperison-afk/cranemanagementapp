import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const companySchema = z.object({
  name: z.string().min(1, "会社名は必須です"),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  industryType: z.string().optional(),
  billingFlag: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET: 取引先一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { address: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          _count: {
            select: {
              salesOpportunities: true,
              equipment: true,
              projects: true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("取引先一覧取得エラー:", error);
    return NextResponse.json(
      { error: "取引先一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 取引先作成
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
    const validatedData = companySchema.parse(body);

    const company = await prisma.company.create({
      data: {
        name: validatedData.name,
        postalCode: validatedData.postalCode,
        address: validatedData.address,
        phone: validatedData.phone,
        email: validatedData.email || undefined,
        industryType: validatedData.industryType,
        billingFlag: validatedData.billingFlag || false,
        notes: validatedData.notes,
      },
    });

    // 作成履歴を記録
    await createAuditLog("Company", company.id, "CREATE", {
      newValue: company,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("取引先作成エラー:", error);
    return NextResponse.json(
      { error: "取引先の作成に失敗しました" },
      { status: 500 }
    );
  }
}

