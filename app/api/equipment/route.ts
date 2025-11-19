import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const equipmentSchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  projectId: z.string().optional(),
  name: z.string().min(1, "機器名称は必須です"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  specifications: z.string().optional(),
  notes: z.string().optional(),
});

// GET: 機器一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const companyId = searchParams.get("companyId");
    const projectId = searchParams.get("projectId");
    const model = searchParams.get("model");
    const serialNumber = searchParams.get("serialNumber");
    const location = searchParams.get("location");
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
          { model: { contains: search } },
          { serialNumber: { contains: search } },
          { location: { contains: search } },
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

    // プロジェクトフィルター
    if (projectId) {
      whereConditions.push({
        projectId: projectId,
      });
    }

    // 機種・型式フィルター
    if (model) {
      whereConditions.push({
        model: { contains: model },
      });
    }

    // 製造番号フィルター
    if (serialNumber) {
      whereConditions.push({
        serialNumber: { contains: serialNumber },
      });
    }

    // 設置場所フィルター
    if (location) {
      whereConditions.push({
        location: { contains: location },
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

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
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
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              inspectionRecords: true,
            },
          },
        },
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json({
      equipment,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("機器一覧取得エラー:", error);
    return NextResponse.json(
      { error: "機器一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 機器作成
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
    const validatedData = equipmentSchema.parse(body);

    const equipment = await prisma.equipment.create({
      data: {
        companyId: validatedData.companyId,
        projectId: validatedData.projectId || undefined,
        name: validatedData.name,
        model: validatedData.model,
        serialNumber: validatedData.serialNumber,
        location: validatedData.location,
        specifications: validatedData.specifications,
        notes: validatedData.notes,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // 作成履歴を記録
    await createAuditLog("Equipment", equipment.id, "CREATE", {
      newValue: equipment,
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("機器作成エラー:", error);
    return NextResponse.json(
      { error: "機器の作成に失敗しました" },
      { status: 500 }
    );
  }
}

