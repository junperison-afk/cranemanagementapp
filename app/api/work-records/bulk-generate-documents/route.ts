import { NextRequest, NextResponse } from "next/server";
import { getSession, requireEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import ExcelJS from "exceljs";
import AdmZip from "adm-zip";

// POST: 作業記録一括ドキュメント生成
export async function POST(request: NextRequest) {
  try {
    const session = await requireEditor();

    const body = await request.json();
    const workRecordIds = body.workRecordIds as string[] | undefined;
    const templateId = body.templateId as string | undefined;

    if (!workRecordIds || workRecordIds.length === 0) {
      return NextResponse.json(
        { error: "作業記録IDが指定されていません" },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "テンプレートIDが指定されていません" },
        { status: 400 }
      );
    }

    // テンプレートを取得
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        templateType: "REPORT",
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

    // 作業記録データを一括取得
    const workRecords = await prisma.inspectionRecord.findMany({
      where: {
        id: {
          in: workRecordIds,
        },
      },
      include: {
        equipment: {
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
            project: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
                amount: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (workRecords.length === 0) {
      return NextResponse.json(
        { error: "作業記録が見つかりません" },
        { status: 404 }
      );
    }

    // 作業タイプの日本語ラベル
    const workTypeLabels: Record<string, string> = {
      INSPECTION: "点検",
      REPAIR: "修理",
      MAINTENANCE: "メンテナンス",
      OTHER: "その他",
    };

    // 判定記号のラベル
    const judgmentSymbolLabels: Record<string, string> = {
      V: "V（良）",
      "△": "△（修理要）",
      "×": "×（特急修理要）",
      H: "H（手直し済）",
      P: "P（部品取替済）",
      A: "A（調整済）",
      T: "T（増締済）",
      O: "O（給油脂済）",
      S: "S（清掃済）",
      K: "K（経過観察要）",
    };

    // 処置不良内容のラベル
    const defectLabels: Record<string, string> = {
      "01": "01. 摩耗",
      "02": "02. 変形",
      "03": "03. 破損",
      "04": "04. 亀裂",
      "05": "05. 傷",
      "06": "06. 異音",
      "07": "07. 焼損",
      "08": "08. 断線",
      "09": "09. 劣化",
      "10": "10. 弛み",
      "11": "11. 脱落",
      "12": "12. 汚損",
      "13": "13. 錆",
      "14": "14. 素線切れ",
      "15": "15. キンク",
      "16": "16. 陥没",
      "17": "17. 腐食",
      "18": "18. その他",
    };

    // 点検項目の定義（generate-document/route.tsと同じ）
    const INSPECTION_ITEMS = [
      {
        id: "hoisting",
        title: "巻上部",
        categories: [
          {
            id: "brake",
            title: "ブレーキ",
            items: [
              { id: "lining_wear", label: "ライニング摩耗の有無" },
              { id: "slip", label: "スリップ状況" },
              { id: "solenoid_shoe_pin", label: "ソレノイド・シュー・ピン 摩耗作動の有無" },
            ],
          },
          {
            id: "limit_switch",
            title: "リミットスイッチ",
            items: [
              { id: "limit_lever_gap", label: "リミットレバー・ギャップ作動の有無" },
              { id: "contact_wear_limit", label: "接点摩耗の有無" },
            ],
          },
          {
            id: "frame",
            title: "フレーム",
            items: [
              { id: "crack_deform", label: "亀裂・変形の有無" },
            ],
          },
          {
            id: "wire_rope",
            title: "ワイヤロープ（チェン）",
            items: [
              { id: "wear", label: "摩耗の有無" },
              { id: "wire_break", label: "素線切断の有無" },
              { id: "rope_end_equalizer", label: "ロープエンド・エコライザー異常の有無" },
            ],
          },
          {
            id: "load_block",
            title: "ロードブロック",
            items: [
              { id: "hook_retainer_deform", label: "フック外れ止め金具変形の有無" },
              { id: "sheave_pin_wear", label: "シーブ・ピン摩耗破損の有無" },
              { id: "hook_wear", label: "フック摩耗・疵の有無" },
            ],
          },
        ],
      },
      {
        id: "lateral",
        title: "横行部",
        categories: [
          {
            id: "trolley",
            title: "トロリー",
            items: [
              { id: "wheel_guide_roller_wear", label: "ホイル･ガイドローラー摩耗の有無" },
              { id: "lateral_motor_reducer", label: "横行電動・減速機異常の有無" },
            ],
          },
          {
            id: "brake_lateral",
            title: "ブレーキ",
            items: [
              { id: "lining_wear_lateral", label: "ライニング摩耗の有無" },
              { id: "solenoid_shoe_pin_lateral", label: "ソレノイド・シュー・ピン 摩耗作動の有無" },
            ],
          },
          {
            id: "lateral_rail",
            title: "横行レール",
            items: [
              { id: "rail_curvature_lateral", label: "レール曲り及び異常の有無" },
              { id: "stopper_lateral", label: "ストッパー取付状況" },
            ],
          },
        ],
      },
      {
        id: "traveling",
        title: "走行部",
        categories: [
          {
            id: "traveling_rail",
            title: "走行レール",
            items: [
              { id: "obstacle", label: "クレーンガータの走行範囲障害物の有無" },
              { id: "rail_curvature", label: "レール曲り及び異常の有無" },
              { id: "rail_end_stopper", label: "レール両端のストッパー状況および取付ボルト緩みの有無" },
              { id: "rail_bolt", label: "レール取付ボルト緩みの有無" },
            ],
          },
          {
            id: "girder_saddle",
            title: "ガータおよびサドル",
            items: [
              { id: "girder_saddle_bolt", label: "ガータ・サドル取付ボルト緩みの有無" },
              { id: "guide_roller_wear", label: "ガイドローラー摩耗の有無" },
              { id: "wheel_gear_oil", label: "ホイールギャ歯面および車軸給油状況の良否" },
              { id: "wheel_axle_wear", label: "走行車軸の踏面・フランヂ異常摩耗外傷の有無" },
              { id: "wheel_axle_keep", label: "車輪軸キープレート変形・緩みの有無" },
              { id: "saddle_buffer", label: "サドルのバッファ固定状況" },
            ],
          },
          {
            id: "traveling_mechanical",
            title: "走行機械装置",
            items: [
              { id: "traveling_motor_reducer", label: "走行電動減速機異常の有無" },
              { id: "chain_gear_coupling", label: "チェン・ギャー・カップリング軸受摩耗の有無" },
              { id: "lining_wear_mechanical", label: "ライニング摩耗の有無" },
              { id: "solenoid_shoe_pin_mechanical", label: "ソレノイド・シュー・ピン摩耗作動の有無" },
            ],
          },
        ],
      },
      {
        id: "traveling_electrical",
        title: "走行電気部",
        categories: [
          {
            id: "collector",
            title: "集電装置ほか",
            items: [
              { id: "cushion_starter", label: "クッションスターター作動状況" },
              { id: "collector_trolley", label: "コレクター・トロリー線摩耗・変形の有無" },
              { id: "cabtyre_carrier", label: "キャブタイヤー・キャリアー破損・老化の有無" },
              { id: "control_panel", label: "制御盤・電気機器緩みの有無" },
              { id: "limit_switch_lever", label: "リミットスイッチ・レバー作動確認" },
            ],
          },
          {
            id: "lubrication",
            title: "給油",
            items: [
              { id: "hoisting_traveling_oil", label: "巻上部・走行部給油状況" },
            ],
          },
        ],
      },
      {
        id: "other",
        title: "その他",
        categories: [
          {
            id: "insulation_resistance",
            title: "絶縁抵抗",
            items: [
              { id: "insulation_resistance_value", label: "絶縁抵抗（MΩ）" },
            ],
          },
          {
            id: "push_button",
            title: "押釦スイッチ",
            items: [
              { id: "contact_wear_button", label: "接点摩耗の有無" },
              { id: "wiring_screw", label: "配線締付ネジゆるみの有無" },
              { id: "case_insulation", label: "ケースおよび絶縁板損傷の有無" },
              { id: "cabtyre_aging", label: "キャプタイヤー老化・変形の有無" },
            ],
          },
          {
            id: "magnet_switch",
            title: "マグネットスイッチ",
            items: [
              { id: "contact_wear_magnet", label: "接点摩耗の有無" },
              { id: "wiring_screw_magnet", label: "配線締付ネジゆるみの有無" },
              { id: "operation_check", label: "作動確認" },
            ],
          },
        ],
      },
    ];

    // ZIPファイルを作成
    const zip = new AdmZip();

    // 各作業記録に対してドキュメントを生成
    for (const workRecord of workRecords) {
      try {
        // チェックリストデータをパース
        let checklistData: any = {};
        if (workRecord.checklistData) {
          try {
            checklistData = JSON.parse(workRecord.checklistData);
          } catch (e) {
            console.error("チェックリストデータのパースエラー:", e);
          }
        }

        // 点検項目のプレースホルダーを生成
        const checklistPlaceholders: Record<string, string> = {};
        INSPECTION_ITEMS.forEach((section) => {
          section.categories.forEach((category) => {
            category.items.forEach((item) => {
              const key = `${section.id}_${category.id}_${item.id}`;
              const value = checklistData[section.id]?.[category.id]?.[item.id] || "";
              checklistPlaceholders[key] = value;
              
              // 処置不良内容のプレースホルダー
              const defectKey = `${item.id}_defect`;
              const defectValue = checklistData[section.id]?.[category.id]?.[defectKey] || "";
              checklistPlaceholders[`${key}_defect_label`] = defectValue
                ? defectLabels[defectValue] || defectValue
                : "";
            });
          });
        });

        const inspectionDate = new Date(workRecord.inspectionDate);
        const projectStartDate = workRecord.equipment.project?.startDate
          ? new Date(workRecord.equipment.project.startDate)
          : null;
        const projectEndDate = workRecord.equipment.project?.endDate
          ? new Date(workRecord.equipment.project.endDate)
          : null;

        // テンプレートデータを準備
        const templateData: Record<string, any> = {
          // 作業記録基本情報
          workType: workRecord.workType,
          workTypeLabel: workTypeLabels[workRecord.workType] || workRecord.workType,
          inspectionDate: inspectionDate.toLocaleDateString("ja-JP"),
          inspectionDateDateTime: `${inspectionDate.toLocaleDateString("ja-JP")} ${inspectionDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`,
          findings: workRecord.findings || "",
          documentNumber: workRecord.documentNumber || "",
          installationFactory: workRecord.installationFactory || "",

          // 機器情報
          equipmentName: workRecord.equipment.name || "",
          equipmentModel: workRecord.equipment.model || "",
          equipmentSerialNumber: workRecord.equipment.serialNumber || "",
          equipmentLocation: workRecord.equipment.location || "",

          // 会社情報
          companyName: workRecord.equipment.company.name || "",
          companyPostalCode: workRecord.equipment.company.postalCode || "",
          companyAddress: workRecord.equipment.company.address || "",
          companyPhone: workRecord.equipment.company.phone || "",
          companyEmail: workRecord.equipment.company.email || "",

          // プロジェクト情報
          projectTitle: workRecord.equipment.project?.title || "",
          projectStatus: workRecord.equipment.project?.status || "",
          projectStartDate: projectStartDate
            ? projectStartDate.toLocaleDateString("ja-JP")
            : "",
          projectEndDate: projectEndDate
            ? projectEndDate.toLocaleDateString("ja-JP")
            : "",
          projectAmount: workRecord.equipment.project?.amount
            ? workRecord.equipment.project.amount.toNumber().toString()
            : "",
          projectAmountFormatted: workRecord.equipment.project?.amount
            ? `¥${workRecord.equipment.project.amount.toNumber().toLocaleString("ja-JP")}`
            : "",

          // 担当者情報
          userName: workRecord.user.name || "",
          userEmail: workRecord.user.email || "",
          userPhone: workRecord.user.phone || "",

          // 点検結果データ
          checklistData: workRecord.checklistData || "",

          // 点検項目の個別プレースホルダー
          ...checklistPlaceholders,
        };

        let buffer: Buffer;
        let fileName: string;

        // Wordテンプレートを処理
        if (template.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const fileBuffer: Buffer = Buffer.isBuffer(template.fileData) 
            ? template.fileData 
            : Buffer.from(new Uint8Array(template.fileData));
          const docZip = new PizZip(fileBuffer);
          const doc = new Docxtemplater(docZip, {
            paragraphLoop: true,
            linebreaks: true,
          });

          try {
            doc.setData(templateData);
            doc.render();
          } catch (error: any) {
            console.error(`作業記録 ${workRecord.id} のテンプレートレンダリングエラー:`, error);
            continue; // この作業記録をスキップして次へ
          }

          buffer = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
          });

          fileName = `作業記録_${workRecord.equipment.company.name}_${workRecord.equipment.name}_${inspectionDate.toISOString().split("T")[0]}.docx`;
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
          fileName = `作業記録_${workRecord.equipment.company.name}_${workRecord.equipment.name}_${inspectionDate.toISOString().split("T")[0]}.xlsx`;
        } else {
          console.error(`サポートされていないファイル形式: ${template.mimeType}`);
          continue; // この作業記録をスキップして次へ
        }

        // ZIPファイルに追加
        zip.addFile(fileName, buffer);
      } catch (error) {
        console.error(`作業記録 ${workRecord.id} の処理エラー:`, error);
        // エラーが発生しても他の作業記録の処理を続ける
      }
    }

    // ZIPファイルをバッファに変換
    const zipBuffer = zip.toBuffer();

    // ZIPファイルを返す
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent("作業記録一括印刷.zip")}"`,
      },
    });
  } catch (error) {
    console.error("作業記録一括ドキュメント生成エラー:", error);
    return NextResponse.json(
      { error: "作業記録一括ドキュメントの生成に失敗しました" },
      { status: 500 }
    );
  }
}

