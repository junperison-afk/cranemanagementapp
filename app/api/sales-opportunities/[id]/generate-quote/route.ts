import { NextRequest, NextResponse } from "next/server";
import { getSession, requireEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import ExcelJS from "exceljs";

// POST: 見積書生成
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireEditor();

    const body = await request.json();
    const templateId = body.templateId as string | undefined;
    const quoteId = body.quoteId as string | undefined; // 見積ID（オプショナル）

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
        contract: {
          select: {
            contractNumber: true,
            contractDate: true,
          },
        },
        project: {
          select: {
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            quotes: true,
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

    // 見積データを取得（見積IDが指定されている場合）
    let selectedQuote = null;
    if (quoteId) {
      selectedQuote = await prisma.salesQuote.findUnique({
        where: { id: quoteId },
        include: {
          items: {
            orderBy: {
              itemNumber: "asc",
            },
          },
        },
      });

      if (!selectedQuote) {
        return NextResponse.json(
          { error: "見積が見つかりません" },
          { status: 404 }
        );
      }

      // 営業案件IDが一致するか確認
      if (selectedQuote.salesOpportunityId !== params.id) {
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
        templateType: "QUOTE",
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

    // 見積ステータスの日本語ラベル
    const quoteStatusLabels: Record<string, string> = {
      DRAFT: "下書き",
      SENT: "送信済み",
      ACCEPTED: "承認済み",
      REJECTED: "却下",
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

    // 見積データの日付
    const quoteCreatedAtDate = selectedQuote
      ? new Date(selectedQuote.createdAt)
      : null;
    const quoteUpdatedAtDate = selectedQuote
      ? new Date(selectedQuote.updatedAt)
      : null;
    const quoteValidUntilDate = selectedQuote?.validUntil
      ? new Date(selectedQuote.validUntil)
      : null;

    // 見積明細を固定行数（最大10行）で準備
    const maxItems = 10;
    const itemsData: Record<string, string | number> = {};
    
    if (selectedQuote && selectedQuote.items) {
      selectedQuote.items.slice(0, maxItems).forEach((item, index) => {
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
    for (let i = (selectedQuote?.items?.length || 0) + 1; i <= maxItems; i++) {
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
    const totalAmount = selectedQuote
      ? selectedQuote.amount.toNumber()
      : 0;

    // テンプレートに差し込むデータを準備
    const templateData = {
      // 取引先情報
      companyName: salesOpportunity.company.name || "",
      companyPostalCode: salesOpportunity.company.postalCode || "",
      companyAddress: salesOpportunity.company.address || "",
      companyPhone: salesOpportunity.company.phone || "",
      companyEmail: salesOpportunity.company.email || "",
      
      // 営業案件情報（詳細画面の基本情報セクション）
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
      
      // 見積情報（見積IDが指定されている場合のみ）
      quoteNumber: selectedQuote?.quoteNumber || "",
      quoteAmount: selectedQuote
        ? selectedQuote.amount.toNumber().toString()
        : "",
      quoteAmountFormatted: selectedQuote
        ? `¥${selectedQuote.amount.toNumber().toLocaleString("ja-JP")}`
        : "",
      quoteStatus: selectedQuote?.status || "",
      quoteStatusLabel: selectedQuote?.status
        ? quoteStatusLabels[selectedQuote.status] || ""
        : "",
      quoteConditions: selectedQuote?.conditions || "",
      quoteValidUntil: quoteValidUntilDate
        ? quoteValidUntilDate.toLocaleDateString("ja-JP")
        : "",
      quoteNotes: selectedQuote?.notes || "",
      quoteCreatedAt: quoteCreatedAtDate
        ? quoteCreatedAtDate.toLocaleDateString("ja-JP")
        : "",
      quoteCreatedAtDateTime: quoteCreatedAtDate
        ? `${quoteCreatedAtDate.toLocaleDateString("ja-JP")} ${quoteCreatedAtDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
        : "",
      quoteUpdatedAt: quoteUpdatedAtDate
        ? quoteUpdatedAtDate.toLocaleDateString("ja-JP")
        : "",
      quoteUpdatedAtDateTime: quoteUpdatedAtDate
        ? `${quoteUpdatedAtDate.toLocaleDateString("ja-JP")} ${quoteUpdatedAtDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
        : "",
      
      // 見積明細（固定行数方式）
      ...itemsData,
      
      // 見積明細の合計情報
      itemsCount: selectedQuote?.items?.length?.toString() || "0",
      totalAmount: totalAmount.toString(),
      totalAmountFormatted: `¥${totalAmount.toLocaleString("ja-JP")}`,
      
      // 関連情報（詳細画面の関連情報セクション）
      quoteCount: salesOpportunity._count?.quotes?.toString() || "0",
      contractNumber: salesOpportunity.contract?.contractNumber || "",
      contractDate: salesOpportunity.contract?.contractDate
        ? new Date(salesOpportunity.contract.contractDate).toLocaleDateString("ja-JP")
        : "",
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
      // テンプレートをバッファから読み込み（Bufferに明示的に変換）
      // PrismaのBytes型をBufferに変換
      const fileBuffer: Buffer = Buffer.isBuffer(template.fileData) 
        ? template.fileData 
        : Buffer.from(new Uint8Array(template.fileData));
      const zip = new PizZip(fileBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // データを差し込み
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

      // 生成されたWordファイルを取得
      buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      fileName = `見積書_${salesOpportunity.company.name}_${new Date().toISOString().split("T")[0]}.docx`;
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    // Excelテンプレートを処理
    else if (template.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      const workbook = new ExcelJS.Workbook();
      
      // テンプレートをバッファから読み込み
      // PrismaのBytes型をBufferに変換（ExcelJSはBuffer型を期待）
      // PrismaのBytes型はBufferとして扱われるため、Buffer.from()で変換
      const fileBuffer = Buffer.isBuffer(template.fileData)
        ? template.fileData
        : Buffer.from(
            template.fileData instanceof ArrayBuffer
              ? new Uint8Array(template.fileData)
              : (template.fileData as Uint8Array | Buffer)
          );
      // ExcelJSのload()メソッドの型定義が厳密なため型アサーションを使用
      await workbook.xlsx.load(fileBuffer as any);

      // すべてのワークシートを処理
      workbook.worksheets.forEach((worksheet) => {
        // すべてのセルを走査してプレースホルダーを置換
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell({ includeEmpty: false }, (cell) => {
            const cellValue = cell.value?.toString() || "";
            
            // プレースホルダーを検索して置換
            if (cellValue.includes("{{")) {
              let newValue = cellValue;
              
              // すべてのプレースホルダーを置換
              Object.entries(templateData).forEach(([key, value]) => {
                const placeholder = `{{${key}}}`;
                if (cellValue.includes(placeholder)) {
                  // プレースホルダーを値に置換
                  newValue = newValue.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value || ""));
                }
              });
              
              // セルの値を更新
              cell.value = newValue;
              
              // 数値の場合、数値型に変換を試みる
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

      // Excelファイルをバッファに変換
      buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      fileName = `見積書_${salesOpportunity.company.name}_${new Date().toISOString().split("T")[0]}.xlsx`;
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      return NextResponse.json(
        { error: "サポートされていないファイル形式です（.docxまたは.xlsxのみ）" },
        { status: 400 }
      );
    }

    // 生成されたファイルを返す
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("見積書生成エラー:", error);
    return NextResponse.json(
      { error: "見積書の生成に失敗しました" },
      { status: 500 }
    );
  }
}
