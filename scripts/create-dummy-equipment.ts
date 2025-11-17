/**
 * ダミー機器データを作成するスクリプト
 * 実行方法: npx tsx scripts/create-dummy-equipment.ts
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

  // 既存のプロジェクトを取得（なければ作成）
  let project = await prisma.project.findFirst({
    where: { companyId: company.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        companyId: company.id,
        title: "工場A 天井クレーン点検プロジェクト",
        status: "IN_PROGRESS",
        amount: 1500000,
        startDate: new Date("2024-01-15"),
      },
    });
    console.log("プロジェクトを作成しました:", project.title);
  }

  // ダミー機器データを作成
  const equipmentList = [
    {
      name: "天井クレーン 1号機",
      model: "5t 天井クレーン",
      serialNumber: "CR-2020-001",
      location: "第1工場 製造ラインA",
      specifications: "定格荷重: 5t\nスパン: 10m\n揚程: 6m",
      notes: "定期点検対象。2020年導入。",
    },
    {
      name: "天井クレーン 2号機",
      model: "5t 天井クレーン",
      serialNumber: "CR-2020-002",
      location: "第1工場 製造ラインB",
      specifications: "定格荷重: 5t\nスパン: 10m\n揚程: 6m",
      notes: "定期点検対象。2020年導入。",
    },
    {
      name: "天井クレーン 3号機",
      model: "3t 天井クレーン",
      serialNumber: "CR-2021-003",
      location: "第1工場 倉庫エリア",
      specifications: "定格荷重: 3t\nスパン: 8m\n揚程: 5m",
      notes: "2021年導入。軽量物搬送用。",
    },
    {
      name: "天井クレーン 4号機",
      model: "10t 天井クレーン",
      serialNumber: "CR-2019-004",
      location: "第2工場 組立エリア",
      specifications: "定格荷重: 10t\nスパン: 12m\n揚程: 8m",
      notes: "大型部品搬送用。2019年導入。",
    },
    {
      name: "天井クレーン 5号機",
      model: "10t 天井クレーン",
      serialNumber: "CR-2019-005",
      location: "第2工場 組立エリア",
      specifications: "定格荷重: 10t\nスパン: 12m\n揚程: 8m",
      notes: "大型部品搬送用。2019年導入。",
    },
  ];

  console.log("機器データを作成中...\n");

  for (const data of equipmentList) {
    const equipment = await prisma.equipment.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        ...data,
      },
    });

    console.log(`✓ 作成完了: ${equipment.name}`);
    console.log(`  ID: ${equipment.id}`);
    console.log(`  機種: ${equipment.model}`);
    console.log(`  製造番号: ${equipment.serialNumber}`);
    console.log(`  設置場所: ${equipment.location}\n`);
  }

  console.log(`合計 ${equipmentList.length}件の機器データを作成しました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

