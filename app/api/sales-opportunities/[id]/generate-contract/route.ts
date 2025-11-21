import { NextRequest, NextResponse } from "next/server";
import { getSession, requireEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import ExcelJS from "exceljs";

// POST: 受注書生成
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireEditor();

    const body = await request.json();
    const templateId = body.templateId as string | undefined;
    const contractId = body.contractId as string | undefined; // 受注書ID（オプショナル）

    if (!templateId) {
      return NextResponse.json(
        { error: "テンプレートIDが指定されていません" },
        { status: 400 }
      );
    }

    // 営業案件データを取得
    const salesOpportunity = await prisma.salesOpportunity.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            postalCode: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        contracts: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            contractNumber: true,
            contractDate: true,
          },
          take: 1, // 最新の1件のみ
        },
        project: {
          select: {
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    if (!salesOpportunity) {
      return NextResponse.json(
        { error: "営業案件が見つかりません" },
        { status: 404 }
      );
    }

    // 受注書データを取得（受注書IDが指定されている場合）
    let selectedContract = null;
    if (contractId) {
      selectedContract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          items: {
            orderBy: {
              itemNumber: "asc",
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!selectedContract) {
        return NextResponse.json(
          { error: "受注書が見つかりません" },
          { status: 404 }
        );
      }

      // 営業案件IDが一致するか確認
      if (selectedContract.salesOpportunityId !== params.id) {
        return NextResponse.json(
          { error: "営業案件が見つかりません" },
          { status: 404 }
        );
      }
    }

    // テンプレートを取得
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        templateType: "CONTRACT",
        isActive: true,
        OR: [
          { userId: session.user.id },
          { isDefault: true },
        ],
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "テンプレートが見つかりません" },
        { status: 404 }
      );
    }

    // ステータスの日本語ラベル
    const statusLabels: Record<string, string> = {
      ESTIMATING: "見積中",
      WON: "受注",
      LOST: "失注",
    };

    // プロジェクトステータスの日本語ラベル
    const projectStatusLabels: Record<string, string> = {
      PLANNING: "計画中",
      IN_PROGRESS: "進行中",
      ON_HOLD: "保留",
      COMPLETED: "完了",
    };

    // 発生日
    const occurredAtDate = salesOpportunity.occurredAt
      ? new Date(salesOpportunity.occurredAt)
      : null;

    // 受注書データの日付
    const contractDate = selectedContract
      ? new Date(selectedContract.contractDate)
      : null;
    const contractCreatedAtDate = selectedContract
      ? new Date(selectedContract.createdAt)
      : null;
    const contractUpdatedAtDate = selectedContract
      ? new Date(selectedContract.updatedAt)
      : null;

    // 受注明細を固定行数（最大10行）で準備
    const maxItems = 10;
    const itemsData: Record<string, string | number> = {};
    
    if (selectedContract && selectedContract.items) {
      selectedContract.items.slice(0, maxItems).forEach((item, index) => {
        const num = index + 1;
        itemsData[`item${num}Number`] = item.itemNumber.toString();
        itemsData[`item${num}Description`] = item.description || "";
        itemsData[`item${num}Quantity`] = item.quantity?.toNumber()?.toString() || "";
        itemsData[`item${num}UnitPrice`] = item.unitPrice?.toNumber()?.toString() || "";
        itemsData[`item${num}UnitPriceFormatted`] = item.unitPrice
          ? `¥${item.unitPrice.toNumber().toLocaleString("ja-JP")}`
          : "";
        itemsData[`item${num}Amount`] = item.amount.toNumber().toString();
        itemsData[`item${num}AmountFormatted`] = `¥${item.amount.toNumber().toLocaleString("ja-JP")}`;
        itemsData[`item${num}Notes`] = item.notes || "";
      });
    }

    // 残りの行は空文字列で埋める
    for (let i = (selectedContract?.items?.length || 0) + 1; i <= maxItems; i++) {
      itemsData[`item${i}Number`] = "";
      itemsData[`item${i}Description`] = "";
      itemsData[`item${i}Quantity`] = "";
      itemsData[`item${i}UnitPrice`] = "";
      itemsData[`item${i}UnitPriceFormatted`] = "";
      itemsData[`item${i}Amount`] = "";
      itemsData[`item${i}AmountFormatted`] = "";
      itemsData[`item${i}Notes`] = "";
    }

    // 合計金額
    const totalAmount = selectedContract
      ? selectedContract.amount.toNumber()
      : 0;

    // テンプレートに差し込むデータを準備
    const templateData = {
      // 取引先情報
      companyName: salesOpportunity.company.name || "",
      companyPostalCode: salesOpportunity.company.postalCode || "",
      companyAddress: salesOpportunity.company.address || "",
      companyPhone: salesOpportunity.company.phone || "",
      companyEmail: salesOpportunity.company.email || "",
      
      // 営業案件情報
      opportunityTitle: salesOpportunity.title || "",
      status: salesOpportunity.status || "",
      statusLabel: statusLabels[salesOpportunity.status] || "",
      estimatedAmount: salesOpportunity.estimatedAmount
        ? salesOpportunity.estimatedAmount.toNumber().toLocaleString("ja-JP")
        : "",
      estimatedAmountFormatted: salesOpportunity.estimatedAmount
        ? `¥${salesOpportunity.estimatedAmount.toNumber().toLocaleString("ja-JP")}`
        : "",
      craneCount: salesOpportunity.craneCount?.toString() || "",
      craneInfo: salesOpportunity.craneInfo || "",
      notes: salesOpportunity.notes || "",
      occurredAt: occurredAtDate
        ? occurredAtDate.toLocaleDateString("ja-JP")
        : "",
      
      // 受注書情報（受注書IDが指定されている場合のみ）
      contractNumber: selectedContract?.contractNumber || "",
      contractAmount: selectedContract
        ? selectedContract.amount.toNumber().toString()
        : "",
      contractAmountFormatted: selectedContract
        ? `¥${selectedContract.amount.toNumber().toLocaleString("ja-JP")}`
        : "",
      contractConditions: selectedContract?.conditions || "",
      contractDate: contractDate
        ? contractDate.toLocaleDateString("ja-JP")
        : "",
      contractCreatedAt: contractCreatedAtDate
        ? contractCreatedAtDate.toLocaleDateString("ja-JP")
        : "",
      contractCreatedAtDateTime: contractCreatedAtDate
        ? `${contractCreatedAtDate.toLocaleDateString("ja-JP")} ${contractCreatedAtDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
        : "",
      contractUpdatedAt: contractUpdatedAtDate
        ? contractUpdatedAtDate.toLocaleDateString("ja-JP")
        : "",
      contractUpdatedAtDateTime: contractUpdatedAtDate
        ? `${contractUpdatedAtDate.toLocaleDateString("ja-JP")} ${contractUpdatedAtDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
        : "",
      contractCreatedBy: selectedContract?.createdBy?.name || selectedContract?.createdBy?.email || "",
      
      // 受注明細（固定行数方式）
      ...itemsData,
      
      // 受注明細の合計情報
      itemsCount: selectedContract?.items?.length?.toString() || "0",
      totalAmount: totalAmount.toString(),
      totalAmountFormatted: `¥${totalAmount.toLocaleString("ja-JP")}`,
      
      // 関連情報
      contractCount: salesOpportunity._count?.contracts?.toString() || "0",
      projectTitle: salesOpportunity.project?.title || "",
      projectStatus: salesOpportunity.project?.status || "",
      projectStatusLabel: salesOpportunity.project?.status
        ? projectStatusLabels[salesOpportunity.project.status] || ""
        : "",
    };

    let buffer: Buffer;
    let fileName: string;
    let contentType: string;

    // Wordテンプレートを処理
    if (template.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const fileBuffer: Buffer = Buffer.isBuffer(template.fileData) 
        ? template.fileData 
        : Buffer.from(new Uint8Array(template.fileData));
      const zip = new PizZip(fileBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      try {
        doc.setData(templateData);
        doc.render();
      } catch (error: any) {
        console.error("テンプレートレンダリングエラー:", error);
        return NextResponse.json(
          { error: `テンプレートの処理に失敗しました: ${error.message}` },
          { status: 500 }
        );
      }

      buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      fileName = `受注書_${salesOpportunity.company.name}_${new Date().toISOString().split("T")[0]}.docx`;
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    // Excelテンプレートを処理
    else if (template.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      const workbook = new ExcelJS.Workbook();
      
      const fileBuffer = Buffer.isBuffer(template.fileData)
        ? template.fileData
        : Buffer.from(new Uint8Array(template.fileData));
      await workbook.xlsx.load(fileBuffer as any);

      workbook.worksheets.forEach((worksheet) => {
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell({ includeEmpty: false }, (cell) => {
            const cellValue = cell.value?.toString() || "";
            
            if (cellValue.includes("{{")) {
              let newValue = cellValue;
              
              Object.entries(templateData).forEach(([key, value]) => {
                const placeholder = `{{${key}}}`;
                if (cellValue.includes(placeholder)) {
                  newValue = newValue.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value || ""));
                }
              });
              
              cell.value = newValue;
              
              if (newValue.match(/^\d+$/)) {
                const numValue = Number(newValue);
                if (!isNaN(numValue)) {
                  cell.value = numValue;
                }
              }
            }
          });
        });
      });

      buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      fileName = `受注書_${salesOpportunity.company.name}_${new Date().toISOString().split("T")[0]}.xlsx`;
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      return NextResponse.json(
        { error: "サポートされていないファイル形式です（.docxまたは.xlsxのみ）" },
        { status: 400 }
      );
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("受注書生成エラー:", error);
    return NextResponse.json(
      { error: "受注書の生成に失敗しました" },
      { status: 500 }
    );
  }
}

