/**
 * ダミー営業案件データを作成するスクリプト
 * 実行方法: npx tsx scripts/create-dummy-sales-opportunities.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 既存の取引先を取得（なければ作成）
  let company = await prisma.company.findFirst({
    where: { name: "株式会社サンプル工業" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "株式会社サンプル工業",
        postalCode: "100-0001",
        address: "東京都千代田区千代田1-1-1",
        phone: "03-1234-5678",
        email: "info@sample-kogyo.co.jp",
        industryType: "製造業",
        billingFlag: true,
        notes: "サンプル取引先データです。\nテスト用に作成されました。",
      },
    });
    console.log("取引先を作成しました:", company.name);
  }

  // ダミー営業案件データを作成
  const salesOpportunities = [
    {
      title: "工場A 天井クレーン点検案件",
      status: "ESTIMATING" as const,
      estimatedAmount: 1500000,
      craneCount: 3,
      craneInfo: "5t天井クレーン 2台、3t天井クレーン 1台",
      occurredAt: new Date("2024-01-15"),
      notes: "初回点検案件。工場Aの3台の天井クレーンの定期点検を依頼。",
    },
    {
      title: "工場B クレーン点検・メンテナンス",
      status: "WON" as const,
      estimatedAmount: 2000000,
      craneCount: 5,
      craneInfo: "10t天井クレーン 2台、5t天井クレーン 3台",
      occurredAt: new Date("2024-02-01"),
      notes: "受注済み案件。工場Bの全クレーンの点検とメンテナンスを実施予定。",
    },
    {
      title: "倉庫C 小型クレーン点検",
      status: "ESTIMATING" as const,
      estimatedAmount: 800000,
      craneCount: 2,
      craneInfo: "2t天井クレーン 2台",
      occurredAt: new Date("2024-02-10"),
      notes: "小型クレーンの点検案件。見積提示中。",
    },
    {
      title: "工場D 大型クレーン点検",
      status: "LOST" as const,
      estimatedAmount: 3000000,
      craneCount: 4,
      craneInfo: "20t天井クレーン 2台、10t天井クレーン 2台",
      occurredAt: new Date("2024-01-20"),
      notes: "失注案件。他社に発注された。",
    },
    {
      title: "工場E 定期点検サービス",
      status: "WON" as const,
      estimatedAmount: 1200000,
      craneCount: 3,
      craneInfo: "5t天井クレーン 3台",
      occurredAt: new Date("2024-02-15"),
      notes: "定期点検サービス契約。年間契約の可能性あり。",
    },
  ];

  console.log("営業案件データを作成中...\n");

  for (const data of salesOpportunities) {
    const salesOpportunity = await prisma.salesOpportunity.create({
      data: {
        companyId: company.id,
        ...data,
      },
    });

    console.log(`✓ 作成完了: ${salesOpportunity.title}`);
    console.log(`  ID: ${salesOpportunity.id}`);
    console.log(`  ステータス: ${salesOpportunity.status}`);
    console.log(`  想定金額: ¥${salesOpportunity.estimatedAmount?.toLocaleString()}`);
    console.log(`  クレーン台数: ${salesOpportunity.craneCount}台\n`);
  }

  console.log(`合計 ${salesOpportunities.length}件の営業案件データを作成しました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

