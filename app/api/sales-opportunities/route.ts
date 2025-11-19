import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const salesOpportunitySchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  title: z.string().min(1, "案件タイトルは必須です"),
  status: z.enum(["ESTIMATING", "WON", "LOST"]).optional(),
  estimatedAmount: z.string().optional(),
  craneCount: z.number().int().positive().optional(),
  craneInfo: z.string().optional(),
  occurredAt: z.string().optional(),
  notes: z.string().optional(),
});

// GET: 営業案件一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");
    const estimatedAmount = searchParams.get("estimatedAmount");
    const craneCount = searchParams.get("craneCount");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const whereConditions: any[] = [];

    // 検索条件
    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search } },
          { craneInfo: { contains: search } },
          { notes: { contains: search } },
          { company: { name: { contains: search } } },
        ],
      });
    }

    // ステータスフィルター
    if (status) {
      whereConditions.push({
        status: status,
      });
    }

    // 取引先フィルター
    if (companyId) {
      whereConditions.push({
        companyId: companyId,
      });
    }

    // 想定金額フィルター
    if (estimatedAmount) {
      const estimatedAmountValue = parseFloat(estimatedAmount);
      if (!isNaN(estimatedAmountValue)) {
        whereConditions.push({
          estimatedAmount: { equals: estimatedAmountValue },
        });
      }
    }

    // クレーン台数フィルター
    if (craneCount) {
      const craneCountValue = parseInt(craneCount);
      if (!isNaN(craneCountValue)) {
        whereConditions.push({
          craneCount: { equals: craneCountValue },
        });
      }
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [salesOpportunities, total] = await Promise.all([
      prisma.salesOpportunity.findMany({
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
          _count: {
            select: {
              quotes: true,
            },
          },
        },
      }),
      prisma.salesOpportunity.count({ where }),
    ]);

    return NextResponse.json({
      salesOpportunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("営業案件一覧取得エラー:", error);
    return NextResponse.json(
      { error: "営業案件一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 営業案件作成
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
    const validatedData = salesOpportunitySchema.parse(body);

    const salesOpportunity = await prisma.salesOpportunity.create({
      data: {
        companyId: validatedData.companyId,
        title: validatedData.title,
        status: validatedData.status || "ESTIMATING",
        estimatedAmount: validatedData.estimatedAmount
          ? parseFloat(validatedData.estimatedAmount)
          : null,
        craneCount: validatedData.craneCount,
        craneInfo: validatedData.craneInfo,
        occurredAt: validatedData.occurredAt
          ? new Date(validatedData.occurredAt)
          : null,
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
    await createAuditLog("SalesOpportunity", salesOpportunity.id, "CREATE", {
      newValue: salesOpportunity,
    });

    return NextResponse.json(salesOpportunity, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("営業案件作成エラー:", error);
    return NextResponse.json(
      { error: "営業案件の作成に失敗しました" },
      { status: 500 }
    );
  }
}

