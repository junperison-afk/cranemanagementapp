/**
 * ダミー取引先データを作成するスクリプト
 * 実行方法: npx tsx scripts/create-dummy-company.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ダミー取引先データを作成
  const company = await prisma.company.create({
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

  console.log("ダミー取引先データを作成しました:");
  console.log(`ID: ${company.id}`);
  console.log(`会社名: ${company.name}`);
  console.log(`住所: ${company.address}`);
  console.log(`メール: ${company.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

