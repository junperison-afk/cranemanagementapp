/**
 * ダミー取引先データを作成するスクリプト
 * 実行方法: npx tsx scripts/create-dummy-company.ts
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// 環境変数を読み込む（.env.localを優先）
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  // ダミー取引先データを作成
  const companies = [
    {
      name: "株式会社サンプル工業",
      postalCode: "100-0001",
      address: "東京都千代田区千代田1-1-1",
      phone: "03-1234-5678",
      email: "info@sample-kogyo.co.jp",
      industryType: "製造業",
      billingFlag: true,
      notes: "サンプル取引先データです。\nテスト用に作成されました。",
    },
    {
      name: "有限会社東京製作所",
      postalCode: "135-0001",
      address: "東京都江東区豊洲1-1-1",
      phone: "03-5678-1234",
      email: "info@tokyo-seisakusho.co.jp",
      industryType: "製造業",
      billingFlag: true,
      notes: "金属加工・機械製造を手がける中小企業。定期点検契約を検討中。",
    },
    {
      name: "株式会社関西鉄工",
      postalCode: "550-0001",
      address: "大阪府大阪市西区土佐堀1-1-1",
      phone: "06-1234-5678",
      email: "info@kansai-tekko.co.jp",
      industryType: "製造業",
      billingFlag: true,
      notes: "鉄鋼製品の製造・加工を担当。大型クレーンを多数保有。",
    },
    {
      name: "株式会社中部物流センター",
      postalCode: "450-0001",
      address: "愛知県名古屋市中村区名駅1-1-1",
      phone: "052-1234-5678",
      email: "info@chubu-logistics.co.jp",
      industryType: "物流業",
      billingFlag: true,
      notes: "物流倉庫運営。天井クレーンによる荷役作業を実施。",
    },
    {
      name: "株式会社北海道建設",
      postalCode: "060-0001",
      address: "北海道札幌市中央区北1条西1-1-1",
      phone: "011-123-4567",
      email: "info@hokkaido-kensetsu.co.jp",
      industryType: "建設業",
      billingFlag: false,
      notes: "建設工事を手がける。工事現場でのクレーン点検が必要。",
    },
    {
      name: "株式会社九州造船",
      postalCode: "810-0001",
      address: "福岡県福岡市中央区天神1-1-1",
      phone: "092-123-4567",
      email: "info@kyushu-zosen.co.jp",
      industryType: "製造業",
      billingFlag: true,
      notes: "造船業を営む。大型クレーン設備の定期点検を実施。",
    },
  ];

  console.log("ダミー取引先データを作成中...\n");

  for (const data of companies) {
    // 既に存在するか確認
    const existing = await prisma.company.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      console.log(`✓ スキップ: ${data.name} (既に存在します)`);
      continue;
    }

    const company = await prisma.company.create({
      data,
    });

    console.log(`✓ 作成完了: ${company.name}`);
    console.log(`  ID: ${company.id}`);
    console.log(`  住所: ${company.address}`);
    console.log(`  メール: ${company.email}`);
    console.log(`  業種: ${company.industryType}\n`);
  }

  console.log(`合計 ${companies.length}件の取引先データを作成しました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

