import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const companySchema = z.object({
  name: z.string().min(1, "会社名は必須です").optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  industryType: z.string().optional(),
  billingFlag: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET: 取引先詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        contacts: {
          orderBy: {
            createdAt: "desc",
          },
        },
        salesOpportunities: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            title: true,
            status: true,
            estimatedAmount: true,
            occurredAt: true,
            createdAt: true,
            _count: {
              select: {
                quotes: true,
              },
            },
          },
        },
        equipment: {
          take: 10,
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            location: true,
          },
        },
        projects: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            amount: true,
            createdAt: true,
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            contacts: true,
            salesOpportunities: true,
            equipment: true,
            projects: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "取引先が見つかりません" },
        { status: 404 }
      );
    }

    // Decimal型をnumber型に変換
    const response = {
      ...company,
      salesOpportunities: company.salesOpportunities.map((so: any) => ({
        ...so,
        estimatedAmount: so.estimatedAmount && typeof so.estimatedAmount.toNumber === 'function' 
          ? so.estimatedAmount.toNumber() 
          : so.estimatedAmount,
      })),
      projects: company.projects.map((project: any) => ({
        ...project,
        amount: project.amount && typeof project.amount.toNumber === 'function'
          ? project.amount.toNumber()
          : project.amount,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("取引先詳細取得エラー:", error);
    return NextResponse.json(
      { error: "取引先詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: 取引先更新
export async function PUT(
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
    const validatedData = companySchema.parse(body);

    // 既存データを取得（変更前の値を記録するため）
    const existingCompany = await prisma.company.findUnique({
      where: { id: params.id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "取引先が見つかりません" },
        { status: 404 }
      );
    }

    // 変更されたフィールドを特定
    const changes: Array<{
      field: string;
      oldValue?: any;
      newValue?: any;
    }> = [];

    Object.keys(validatedData).forEach((key) => {
      const typedKey = key as keyof typeof validatedData;
      const oldValue = existingCompany[typedKey];
      const newValue = validatedData[typedKey];

      if (oldValue !== newValue) {
        changes.push({
          field: typedKey,
          oldValue,
          newValue,
        });
      }
    });

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        email: validatedData.email || undefined,
      },
    });

    // 変更履歴を記録
    if (changes.length > 0) {
      if (changes.length === 1) {
        // 単一フィールドの変更
        await createAuditLog("Company", params.id, "UPDATE", {
          field: changes[0].field,
          oldValue: changes[0].oldValue,
          newValue: changes[0].newValue,
        });
      } else {
        // 複数フィールドの変更
        await createAuditLog("Company", params.id, "UPDATE", {
          multipleChanges: changes,
        });
      }
    }

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("取引先更新エラー:", error);
    return NextResponse.json(
      { error: "取引先の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 取引先削除
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

    // 削除前に履歴を記録
    await createAuditLog("Company", params.id, "DELETE", {
      newValue: { deleted: true },
    });

    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "取引先を削除しました" });
  } catch (error) {
    console.error("取引先削除エラー:", error);
    return NextResponse.json(
      { error: "取引先の削除に失敗しました" },
      { status: 500 }
    );
  }
}

