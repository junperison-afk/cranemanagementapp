/**
 * ダミープロジェクトデータを作成するスクリプト
 * 実行方法: npx tsx scripts/create-dummy-projects.ts
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// 環境変数を読み込む（.env.localを優先）
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  console.log("プロジェクトのダミーデータを作成します...");

  // 既存の取引先を取得
  const companies = await prisma.company.findMany({
    take: 10,
  });

  if (companies.length === 0) {
    console.error("取引先が見つかりません。先に取引先のダミーデータを作成してください。");
    return;
  }

  // 既存の営業案件を取得（プロジェクトに関連付けるため）
  const salesOpportunities = await prisma.salesOpportunity.findMany({
    where: { status: "WON" },
    take: 10,
  });

  // 既存のユーザーを取得（担当者として割り当てるため）
  const users = await prisma.user.findMany({
    take: 3,
  });

  // ダミープロジェクトデータ
  const projects = [
    {
      companyId: companies[0].id,
      salesOpportunityId: salesOpportunities[0]?.id || null,
      assignedUserId: users[0]?.id || null,
      title: "工場A 天井クレーン点検プロジェクト",
      status: "IN_PROGRESS" as const,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-12-31"),
      amount: 1500000,
      notes: "定期点検プロジェクト。3台の天井クレーンを対象に実施。",
    },
    {
      companyId: companies[1]?.id || companies[0].id,
      salesOpportunityId: salesOpportunities[1]?.id || null,
      assignedUserId: users[1]?.id || users[0]?.id || null,
      title: "東京製作所 大型クレーン点検",
      status: "IN_PROGRESS" as const,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-11-30"),
      amount: 2000000,
      notes: "大型クレーンの定期点検とメンテナンスを実施。",
    },
    {
      companyId: companies[2]?.id || companies[0].id,
      salesOpportunityId: salesOpportunities[2]?.id || null,
      assignedUserId: users[0]?.id || null,
      title: "関西鉄工 全設備点検プロジェクト",
      status: "PLANNING" as const,
      startDate: new Date("2024-03-01"),
      endDate: null,
      amount: 3000000,
      notes: "全クレーン設備の包括的点検プロジェクト。計画中。",
    },
    {
      companyId: companies[3]?.id || companies[0].id,
      salesOpportunityId: salesOpportunities[3]?.id || null,
      assignedUserId: users[1]?.id || users[0]?.id || null,
      title: "中部物流センター 倉庫クレーン点検",
      status: "IN_PROGRESS" as const,
      startDate: new Date("2024-02-15"),
      endDate: new Date("2024-12-31"),
      amount: 1200000,
      notes: "物流倉庫の天井クレーン点検を実施中。",
    },
    {
      companyId: companies[4]?.id || companies[0].id,
      salesOpportunityId: salesOpportunities[4]?.id || null,
      assignedUserId: users[0]?.id || null,
      title: "北海道建設 工事現場クレーン点検",
      status: "ON_HOLD" as const,
      startDate: null,
      endDate: null,
      amount: 1800000,
      notes: "工事現場のクレーン点検プロジェクト。スケジュール調整中で保留。",
    },
    {
      companyId: companies[5]?.id || companies[0].id,
      salesOpportunityId: salesOpportunities[0]?.id || null,
      assignedUserId: users[1]?.id || users[0]?.id || null,
      title: "九州造船 大型クレーン定期点検",
      status: "COMPLETED" as const,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"),
      amount: 2500000,
      notes: "2023年度の定期点検プロジェクト。完了済み。",
    },
    {
      companyId: companies[0].id,
      salesOpportunityId: null,
      assignedUserId: users[0]?.id || null,
      title: "サンプル工業 追加点検プロジェクト",
      status: "PLANNING" as const,
      startDate: new Date("2024-04-01"),
      endDate: null,
      amount: 900000,
      notes: "追加の点検プロジェクト。計画中。",
    },
  ];

  console.log("プロジェクトデータを作成中...\n");

  let createdCount = 0;
  let skippedCount = 0;

  for (const data of projects) {
    // 既に存在するか確認（営業案件が関連付けられている場合）
    if (data.salesOpportunityId) {
      const existing = await prisma.project.findFirst({
        where: { salesOpportunityId: data.salesOpportunityId },
      });

      if (existing) {
        console.log(`✓ スキップ: ${data.title} (既に関連するプロジェクトが存在します)`);
        skippedCount++;
        continue;
      }
    }

    const project = await prisma.project.create({
      data,
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`✓ 作成完了: ${project.title}`);
    console.log(`  ID: ${project.id}`);
    console.log(`  取引先: ${project.company.name}`);
    console.log(`  ステータス: ${project.status}`);
    console.log(`  金額: ¥${project.amount?.toLocaleString() || "-"}`);
    console.log(`  開始日: ${project.startDate?.toLocaleDateString() || "-"}`);
    console.log(`  終了日: ${project.endDate?.toLocaleDateString() || "-"}\n`);

    createdCount++;
  }

  console.log(`合計 ${createdCount}件のプロジェクトデータを作成しました。`);
  if (skippedCount > 0) {
    console.log(`${skippedCount}件のプロジェクトは既に存在していたためスキップしました。`);
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

