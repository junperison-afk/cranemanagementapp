import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("作業記録のダミーデータを作成します...");

  // 既存の機器を取得
  const equipment = await prisma.equipment.findFirst({
    include: {
      company: true,
    },
  });

  if (!equipment) {
    console.error("機器が見つかりません。先に機器のダミーデータを作成してください。");
    return;
  }

  // 既存のユーザーを取得（テストユーザー）
  const user = await prisma.user.findFirst({
    where: {
      email: "admin@example.com",
    },
  });

  if (!user) {
    console.error("ユーザーが見つかりません。先にテストユーザーを作成してください。");
    return;
  }

  // 作業記録を作成
  const workRecords = [
    {
      equipmentId: equipment.id,
      userId: user.id,
      workType: "INSPECTION" as const,
      inspectionDate: new Date("2024-01-15"),
      overallJudgment: "GOOD" as const,
      findings: "各部品に異常なし。動作確認済み。",
      summary: "定期点検を実施。問題なし。",
      additionalNotes: null,
    },
    {
      equipmentId: equipment.id,
      userId: user.id,
      workType: "REPAIR" as const,
      inspectionDate: new Date("2024-02-20"),
      overallJudgment: null,
      findings: "ワイヤーロープの摩耗を確認。交換を実施。",
      summary: "ワイヤーロープ交換作業完了。",
      additionalNotes: "交換部品: ワイヤーロープ 10mm × 20m",
    },
    {
      equipmentId: equipment.id,
      userId: user.id,
      workType: "INSPECTION" as const,
      inspectionDate: new Date("2024-03-10"),
      overallJudgment: "CAUTION" as const,
      findings: "ブレーキの効きがやや弱い。次回点検時に要確認。",
      summary: "定期点検実施。ブレーキに軽微な問題あり。",
      additionalNotes: null,
    },
    {
      equipmentId: equipment.id,
      userId: user.id,
      workType: "MAINTENANCE" as const,
      inspectionDate: new Date("2024-03-25"),
      overallJudgment: null,
      findings: "潤滑油の補充と清掃を実施。",
      summary: "定期メンテナンス完了。",
      additionalNotes: "使用オイル: グレードISO VG68",
    },
    {
      equipmentId: equipment.id,
      userId: user.id,
      workType: "INSPECTION" as const,
      inspectionDate: new Date("2024-04-15"),
      overallJudgment: "GOOD" as const,
      findings: "前回指摘のブレーキ問題は解消。全体的に良好。",
      summary: "定期点検実施。問題なし。",
      additionalNotes: null,
    },
    {
      equipmentId: equipment.id,
      userId: user.id,
      workType: "REPAIR" as const,
      inspectionDate: new Date("2024-05-05"),
      overallJudgment: null,
      findings: "制御盤の接触不良を確認。配線の接続を修正。",
      summary: "制御盤の接触不良を修理。",
      additionalNotes: "作業時間: 2時間",
    },
    {
      equipmentId: equipment.id,
      userId: user.id,
      workType: "INSPECTION" as const,
      inspectionDate: new Date("2024-05-20"),
      overallJudgment: "GOOD" as const,
      findings: "各部品に異常なし。動作確認済み。",
      summary: "定期点検実施。問題なし。",
      additionalNotes: null,
    },
  ];

  for (const record of workRecords) {
    await prisma.inspectionRecord.create({
      data: record,
    });
  }

  console.log(`${workRecords.length}件の作業記録を作成しました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

