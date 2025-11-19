/**
 * ダミー営業案件データを作成するスクリプト
 * 実行方法: npx tsx scripts/create-dummy-sales-opportunities.ts
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// 環境変数を読み込む（.env.localを優先）
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  // 既存の取引先を取得
  const companies = await prisma.company.findMany({
    take: 10,
  });

  if (companies.length === 0) {
    console.error("取引先が見つかりません。先に取引先のダミーデータを作成してください。");
    return;
  }

  // ダミー営業案件データを作成（複数の取引先に分散）
  const salesOpportunitiesData = [
    {
      companyIndex: 0,
      title: "工場A 天井クレーン点検案件",
      status: "ESTIMATING" as const,
      estimatedAmount: 1500000,
      craneCount: 3,
      craneInfo: "5t天井クレーン 2台、3t天井クレーン 1台",
      occurredAt: new Date("2024-01-15"),
      notes: "初回点検案件。工場Aの3台の天井クレーンの定期点検を依頼。",
    },
    {
      companyIndex: 1,
      title: "東京製作所 大型クレーン点検・メンテナンス",
      status: "WON" as const,
      estimatedAmount: 2000000,
      craneCount: 5,
      craneInfo: "10t天井クレーン 2台、5t天井クレーン 3台",
      occurredAt: new Date("2024-02-01"),
      notes: "受注済み案件。大型クレーンの点検とメンテナンスを実施予定。",
    },
    {
      companyIndex: 2,
      title: "関西鉄工 全設備点検案件",
      status: "ESTIMATING" as const,
      estimatedAmount: 3000000,
      craneCount: 8,
      craneInfo: "20t天井クレーン 2台、10t天井クレーン 4台、5t天井クレーン 2台",
      occurredAt: new Date("2024-02-10"),
      notes: "全クレーン設備の包括的点検案件。見積提示中。",
    },
    {
      companyIndex: 3,
      title: "中部物流センター 倉庫クレーン点検",
      status: "WON" as const,
      estimatedAmount: 1200000,
      craneCount: 4,
      craneInfo: "3t天井クレーン 4台",
      occurredAt: new Date("2024-02-15"),
      notes: "物流倉庫の天井クレーン点検案件。受注済み。",
    },
    {
      companyIndex: 4,
      title: "北海道建設 工事現場クレーン点検",
      status: "ESTIMATING" as const,
      estimatedAmount: 1800000,
      craneCount: 3,
      craneInfo: "10t天井クレーン 2台、5t天井クレーン 1台",
      occurredAt: new Date("2024-03-01"),
      notes: "工事現場のクレーン点検案件。見積提示中。",
    },
    {
      companyIndex: 5,
      title: "九州造船 大型クレーン定期点検",
      status: "WON" as const,
      estimatedAmount: 2500000,
      craneCount: 6,
      craneInfo: "30t天井クレーン 2台、20t天井クレーン 2台、10t天井クレーン 2台",
      occurredAt: new Date("2024-01-20"),
      notes: "大型クレーンの定期点検案件。受注済み。",
    },
    {
      companyIndex: 0,
      title: "サンプル工業 追加点検案件",
      status: "ESTIMATING" as const,
      estimatedAmount: 900000,
      craneCount: 2,
      craneInfo: "5t天井クレーン 2台",
      occurredAt: new Date("2024-03-15"),
      notes: "追加の点検案件。見積提示中。",
    },
    {
      companyIndex: 1,
      title: "東京製作所 定期点検サービス",
      status: "WON" as const,
      estimatedAmount: 1500000,
      craneCount: 4,
      craneInfo: "5t天井クレーン 4台",
      occurredAt: new Date("2024-02-20"),
      notes: "定期点検サービス契約。年間契約の可能性あり。",
    },
  ];

  console.log("営業案件データを作成中...\n");

  let createdCount = 0;
  let skippedCount = 0;

  for (const data of salesOpportunitiesData) {
    const companyIndex = Math.min(data.companyIndex, companies.length - 1);
    const company = companies[companyIndex];

    // 同じタイトルの案件が既に存在するか確認
    const existing = await prisma.salesOpportunity.findFirst({
      where: {
        companyId: company.id,
        title: data.title,
      },
    });

    if (existing) {
      console.log(`✓ スキップ: ${data.title} (既に存在します)`);
      skippedCount++;
      continue;
    }

    const salesOpportunity = await prisma.salesOpportunity.create({
      data: {
        companyId: company.id,
        title: data.title,
        status: data.status,
        estimatedAmount: data.estimatedAmount,
        craneCount: data.craneCount,
        craneInfo: data.craneInfo,
        occurredAt: data.occurredAt,
        notes: data.notes,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`✓ 作成完了: ${salesOpportunity.title}`);
    console.log(`  ID: ${salesOpportunity.id}`);
    console.log(`  取引先: ${salesOpportunity.company.name}`);
    console.log(`  ステータス: ${salesOpportunity.status}`);
    console.log(`  想定金額: ¥${salesOpportunity.estimatedAmount?.toLocaleString()}`);
    console.log(`  クレーン台数: ${salesOpportunity.craneCount}台\n`);

    createdCount++;
  }

  console.log(`合計 ${createdCount}件の営業案件データを作成しました。`);
  if (skippedCount > 0) {
    console.log(`${skippedCount}件の営業案件は既に存在していたためスキップしました。`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

