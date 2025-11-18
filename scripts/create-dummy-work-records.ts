import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// 環境変数を読み込む（.env.localを優先）
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  console.log("作業記録のダミーデータを作成します...");

  // 既存の機器を取得（複数）
  const equipmentList = await prisma.equipment.findMany({
    take: 10,
    include: {
      company: true,
    },
  });

  if (equipmentList.length === 0) {
    console.error("機器が見つかりません。先に機器のダミーデータを作成してください。");
    return;
  }

  // 既存のユーザーを取得（複数）
  const users = await prisma.user.findMany({
    take: 3,
  });

  if (users.length === 0) {
    console.error("ユーザーが見つかりません。先にテストユーザーを作成してください。");
    return;
  }

  // 作業記録のテンプレート
  const workRecordTemplates = [
    {
      workType: "INSPECTION" as const,
      overallJudgment: "GOOD" as const,
      findings: "各部品に異常なし。動作確認済み。",
      summary: "定期点検を実施。問題なし。",
      additionalNotes: null,
    },
    {
      workType: "INSPECTION" as const,
      overallJudgment: "CAUTION" as const,
      findings: "ブレーキの効きがやや弱い。次回点検時に要確認。",
      summary: "定期点検実施。ブレーキに軽微な問題あり。",
      additionalNotes: "次回点検時に再確認が必要。",
    },
    {
      workType: "INSPECTION" as const,
      overallJudgment: "BAD" as const,
      findings: "ワイヤーロープに摩耗を確認。早急な交換が必要。",
      summary: "定期点検実施。ワイヤーロープの交換が必要。",
      additionalNotes: "交換部品の発注が必要。",
    },
    {
      workType: "INSPECTION" as const,
      overallJudgment: "REPAIR" as const,
      findings: "制御盤の接触不良を確認。修理が必要。",
      summary: "定期点検実施。制御盤の修理が必要。",
      additionalNotes: "修理作業を予定。",
    },
    {
      workType: "REPAIR" as const,
      overallJudgment: null,
      findings: "ワイヤーロープの摩耗を確認。交換を実施。",
      summary: "ワイヤーロープ交換作業完了。",
      additionalNotes: "交換部品: ワイヤーロープ 10mm × 20m",
    },
    {
      workType: "REPAIR" as const,
      overallJudgment: null,
      findings: "制御盤の接触不良を確認。配線の接続を修正。",
      summary: "制御盤の接触不良を修理。",
      additionalNotes: "作業時間: 2時間",
    },
    {
      workType: "REPAIR" as const,
      overallJudgment: null,
      findings: "ブレーキパッドの交換を実施。",
      summary: "ブレーキパッド交換作業完了。",
      additionalNotes: "交換部品: ブレーキパッド × 2セット",
    },
    {
      workType: "MAINTENANCE" as const,
      overallJudgment: null,
      findings: "潤滑油の補充と清掃を実施。",
      summary: "定期メンテナンス完了。",
      additionalNotes: "使用オイル: グレードISO VG68",
    },
    {
      workType: "MAINTENANCE" as const,
      overallJudgment: null,
      findings: "各部品の清掃と点検を実施。",
      summary: "定期メンテナンス完了。",
      additionalNotes: "清掃作業: 2時間",
    },
    {
      workType: "MAINTENANCE" as const,
      overallJudgment: null,
      findings: "潤滑油の交換と各部品の点検を実施。",
      summary: "定期メンテナンス完了。",
      additionalNotes: "使用オイル: グレードISO VG68、交換量: 5L",
    },
    {
      workType: "OTHER" as const,
      overallJudgment: null,
      findings: "特別点検を実施。",
      summary: "特別点検完了。",
      additionalNotes: "お客様からの要望による特別点検。",
    },
  ];

  // 日付の範囲を設定（過去1年間）
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  // 各機器に対して作業記録を作成
  const workRecords = [];
  let recordCount = 0;

  for (const equipment of equipmentList) {
    // 各機器に対して3〜8件の作業記録を作成
    const recordCountForEquipment = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < recordCountForEquipment; i++) {
      const template = workRecordTemplates[Math.floor(Math.random() * workRecordTemplates.length)];
      const user = users[Math.floor(Math.random() * users.length)];

      // ランダムな日付を生成（過去1年間）
      const daysAgo = Math.floor(Math.random() * 365);
      const inspectionDate = new Date(oneYearAgo);
      inspectionDate.setDate(inspectionDate.getDate() + daysAgo);

      workRecords.push({
        equipmentId: equipment.id,
        userId: user.id,
        workType: template.workType,
        inspectionDate: inspectionDate,
        overallJudgment: template.overallJudgment,
        findings: template.findings,
        summary: template.summary,
        additionalNotes: template.additionalNotes,
      });
      recordCount++;
    }
  }

  // 日付順にソート
  workRecords.sort((a, b) => a.inspectionDate.getTime() - b.inspectionDate.getTime());

  console.log(`${workRecords.length}件の作業記録を作成中...\n`);

  for (const record of workRecords) {
    await prisma.inspectionRecord.create({
      data: record,
    });
  }

  console.log(`\n合計 ${workRecords.length}件の作業記録を作成しました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

