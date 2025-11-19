/**
 * ダミー連絡先データを作成するスクリプト
 * 実行方法: npx tsx scripts/create-dummy-contacts.ts
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// 環境変数を読み込む（.env.localを優先）
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  console.log("連絡先のダミーデータを作成します...");

  // 既存の取引先を取得
  const companies = await prisma.company.findMany({
    take: 5,
  });

  if (companies.length === 0) {
    console.error("取引先が見つかりません。先に取引先のダミーデータを作成してください。");
    return;
  }

  // ダミー連絡先データを作成
  const contacts = [
    {
      companyId: companies[0].id,
      name: "山田 太郎",
      position: "部長",
      phone: "03-1234-5678",
      email: "yamada@example.co.jp",
      notes: "営業担当。迅速な対応を希望。",
    },
    {
      companyId: companies[0].id,
      name: "佐藤 花子",
      position: "課長",
      phone: "03-1234-5679",
      email: "sato@example.co.jp",
      notes: "技術担当。詳細な仕様確認が必要。",
    },
    {
      companyId: companies[1]?.id || companies[0].id,
      name: "鈴木 一郎",
      position: "工場長",
      phone: "045-1234-5678",
      email: "suzuki@example.co.jp",
      notes: "現場責任者。点検スケジュールの調整を担当。",
    },
    {
      companyId: companies[1]?.id || companies[0].id,
      name: "田中 美咲",
      position: "総務",
      phone: "045-1234-5679",
      email: "tanaka@example.co.jp",
      notes: "契約・請求関連の窓口。",
    },
    {
      companyId: companies[2]?.id || companies[0].id,
      name: "伊藤 健太",
      position: "主任",
      phone: "06-1234-5678",
      email: "ito@example.co.jp",
      notes: "保守担当。緊急時の連絡先。",
    },
    {
      companyId: companies[2]?.id || companies[0].id,
      name: "渡辺 さくら",
      position: "マネージャー",
      phone: "06-1234-5679",
      email: "watanabe@example.co.jp",
      notes: "プロジェクト管理を担当。",
    },
    {
      companyId: companies[3]?.id || companies[0].id,
      name: "中村 大輔",
      position: "課長代理",
      phone: "052-1234-5678",
      email: "nakamura@example.co.jp",
      notes: "予算管理を担当。",
    },
    {
      companyId: companies[4]?.id || companies[0].id,
      name: "小林 麻衣",
      position: "係長",
      phone: "092-1234-5678",
      email: "kobayashi@example.co.jp",
      notes: "品質管理を担当。",
    },
  ];

  console.log("連絡先データを作成中...\n");

  for (const data of contacts) {
    const contact = await prisma.companyContact.create({
      data,
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`✓ 作成完了: ${contact.name}`);
    console.log(`  取引先: ${contact.company.name}`);
    console.log(`  役職: ${contact.position || "-"}`);
    console.log(`  電話: ${contact.phone || "-"}`);
    console.log(`  メール: ${contact.email || "-"}\n`);
  }

  console.log(`合計 ${contacts.length}件の連絡先データを作成しました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

