import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const projectSchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  salesOpportunityId: z.string().optional(),
  assignedUserId: z.string().optional(),
  title: z.string().min(1, "プロジェクトタイトルは必須です"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.string().optional(),
  notes: z.string().optional(),
});

// GET: プロジェクト一覧取得
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
    const assignedUserId = searchParams.get("assignedUserId");
    const amount = searchParams.get("amount");
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
          { title: { contains: search } },
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

    // 担当者フィルター
    if (assignedUserId) {
      whereConditions.push({
        assignedUserId: assignedUserId,
      });
    }

    // 金額フィルター
    if (amount) {
      const amountValue = parseFloat(amount);
      if (!isNaN(amountValue)) {
        whereConditions.push({
          amount: { equals: amountValue },
        });
      }
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

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
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
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          salesOpportunity: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              equipment: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("プロジェクト一覧取得エラー:", error);
    return NextResponse.json(
      { error: "プロジェクト一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: プロジェクト作成
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
    const validatedData = projectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        companyId: validatedData.companyId,
        salesOpportunityId: validatedData.salesOpportunityId || undefined,
        assignedUserId: validatedData.assignedUserId || undefined,
        title: validatedData.title,
        status: validatedData.status || "PLANNING",
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        amount: validatedData.amount ? parseFloat(validatedData.amount) : null,
        notes: validatedData.notes,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        salesOpportunity: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // 作成履歴を記録
    await createAuditLog("Project", project.id, "CREATE", {
      newValue: project,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("プロジェクト作成エラー:", error);
    return NextResponse.json(
      { error: "プロジェクトの作成に失敗しました" },
      { status: 500 }
    );
  }
}

