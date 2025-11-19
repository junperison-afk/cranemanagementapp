import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const inspectionRecordSchema = z.object({
  equipmentId: z.string().min(1, "機器は必須です"),
  userId: z.string().min(1, "担当者は必須です"),
  workType: z.enum(["INSPECTION", "REPAIR", "MAINTENANCE", "OTHER"]).optional(),
  inspectionDate: z.string().min(1, "作業日は必須です"),
  overallJudgment: z.enum(["GOOD", "CAUTION", "BAD", "REPAIR"]).optional(),
  findings: z.string().optional(),
  summary: z.string().optional(),
  additionalNotes: z.string().optional(),
  checklistData: z.string().optional(),
  photos: z.string().optional(),
});

// GET: 作業記録一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const equipmentId = searchParams.get("equipmentId");
    const userId = searchParams.get("userId");
    const workType = searchParams.get("workType");
    const overallJudgment = searchParams.get("overallJudgment");
    const findings = searchParams.get("findings");
    const resultSummary = searchParams.get("resultSummary");
    const inspectionDateAfter = searchParams.get("inspectionDateAfter");
    const inspectionDateBefore = searchParams.get("inspectionDateBefore");
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
          { findings: { contains: search } },
          { summary: { contains: search } },
          { additionalNotes: { contains: search } },
          { equipment: { name: { contains: search } } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      });
    }

    // 機器フィルター
    if (equipmentId) {
      whereConditions.push({
        equipmentId: equipmentId,
      });
    }

    // 担当者フィルター
    if (userId) {
      whereConditions.push({
        userId: userId,
      });
    }

    // 作業タイプフィルター
    if (workType) {
      whereConditions.push({
        workType: workType,
      });
    }

    // 総合判定フィルター
    if (overallJudgment) {
      whereConditions.push({
        overallJudgment: overallJudgment,
      });
    }

    // 所見フィルター
    if (findings) {
      whereConditions.push({
        findings: { contains: findings },
      });
    }

    // 結果サマリフィルター
    if (resultSummary) {
      whereConditions.push({
        summary: { contains: resultSummary },
      });
    }

    // 点検日フィルター
    if (inspectionDateAfter) {
      whereConditions.push({
        inspectionDate: { gte: new Date(inspectionDateAfter) },
      });
    }

    if (inspectionDateBefore) {
      whereConditions.push({
        inspectionDate: { lte: new Date(inspectionDateBefore) },
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

    const [inspectionRecords, total] = await Promise.all([
      prisma.inspectionRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          inspectionDate: "desc",
        },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              model: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.inspectionRecord.count({ where }),
    ]);

    return NextResponse.json({
      inspectionRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("作業記録一覧取得エラー:", error);
    return NextResponse.json(
      { error: "作業記録一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 作業記録作成
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
    const validatedData = inspectionRecordSchema.parse(body);

    const inspectionRecord = await prisma.inspectionRecord.create({
      data: {
        equipmentId: validatedData.equipmentId,
        userId: validatedData.userId,
        workType: validatedData.workType || "INSPECTION",
        inspectionDate: new Date(validatedData.inspectionDate),
        overallJudgment: validatedData.overallJudgment || null,
        findings: validatedData.findings,
        summary: validatedData.summary,
        additionalNotes: validatedData.additionalNotes,
        checklistData: validatedData.checklistData,
        photos: validatedData.photos,
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 作成履歴を記録
    await createAuditLog("WorkRecord", inspectionRecord.id, "CREATE", {
      newValue: inspectionRecord,
    });

    return NextResponse.json(inspectionRecord, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("作業記録作成エラー:", error);
    return NextResponse.json(
      { error: "作業記録の作成に失敗しました" },
      { status: 500 }
    );
  }
}

