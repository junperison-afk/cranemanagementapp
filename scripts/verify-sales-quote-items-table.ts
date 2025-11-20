/**
 * 見積明細テーブル（sales_quote_items）の作成確認スクリプト
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// 環境変数を読み込む（.env.localを優先）
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function verifyTable() {
  console.log("見積明細テーブルの確認を開始します...\n");

  try {
    // 1. テーブルが存在するか確認（Prisma経由で確認）
    console.log("1. テーブル存在確認");
    const tableInfo = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_quote_items'
    `;
    
    if (Array.isArray(tableInfo) && tableInfo.length > 0) {
      console.log("✅ テーブル 'sales_quote_items' が存在します");
    } else {
      console.log("❌ テーブル 'sales_quote_items' が見つかりません");
      return;
    }

    // 2. カラム定義を確認
    console.log("\n2. カラム定義確認");
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'sales_quote_items'
      ORDER BY ordinal_position
    `;

    const expectedColumns = [
      { name: "id", type: "text", nullable: "NO" },
      { name: "salesQuoteId", type: "text", nullable: "NO" },
      { name: "itemNumber", type: "integer", nullable: "NO" },
      { name: "description", type: "text", nullable: "NO" },
      { name: "quantity", type: "numeric", nullable: "YES" },
      { name: "unitPrice", type: "numeric", nullable: "YES" },
      { name: "amount", type: "numeric", nullable: "NO" },
      { name: "notes", type: "text", nullable: "YES" },
      { name: "createdAt", type: "timestamp with time zone", nullable: "NO" },
      { name: "updatedAt", type: "timestamp with time zone", nullable: "NO" },
    ];

    if (Array.isArray(columns)) {
      console.log(`   見つかったカラム数: ${columns.length}`);
      expectedColumns.forEach((expected) => {
        const found = (columns as any[]).find(
          (col: any) => col.column_name === expected.name
        );
        if (found) {
          const nullableMatch =
            found.is_nullable === expected.nullable ||
            (expected.nullable === "YES" && found.is_nullable === "YES");
          console.log(
            `   ✅ ${expected.name}: ${found.data_type} (NULL許可: ${found.is_nullable})`
          );
        } else {
          console.log(`   ❌ ${expected.name}: 見つかりません`);
        }
      });
    }

    // 3. 外部キー制約を確認
    console.log("\n3. 外部キー制約確認");
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'sales_quote_items'
    `;

    if (Array.isArray(foreignKeys) && foreignKeys.length > 0) {
      (foreignKeys as any[]).forEach((fk: any) => {
        if (
          fk.column_name === "salesQuoteId" &&
          fk.foreign_table_name === "sales_quotes"
        ) {
          console.log(
            `   ✅ 外部キー制約: ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
          );
        }
      });
    } else {
      console.log("   ❌ 外部キー制約が見つかりません");
    }

    // 4. インデックスを確認
    console.log("\n4. インデックス確認");
    const indexes = await prisma.$queryRaw`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'sales_quote_items'
      AND schemaname = 'public'
    `;

    if (Array.isArray(indexes) && indexes.length > 0) {
      (indexes as any[]).forEach((idx: any) => {
        console.log(`   ✅ インデックス: ${idx.indexname}`);
      });
    } else {
      console.log("   ⚠️  インデックスが見つかりません");
    }

    // 5. 主キー制約を確認
    console.log("\n5. 主キー制約確認");
    const primaryKey = await prisma.$queryRaw`
      SELECT
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = 'sales_quote_items'
    `;

    if (Array.isArray(primaryKey) && primaryKey.length > 0) {
      (primaryKey as any[]).forEach((pk: any) => {
        console.log(`   ✅ 主キー: ${pk.column_name}`);
      });
    } else {
      console.log("   ❌ 主キー制約が見つかりません");
    }

    // 6. ユニーク制約を確認
    console.log("\n6. ユニーク制約確認");
    const uniqueConstraints = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name = 'sales_quote_items'
        AND tc.constraint_name != 'sales_quote_items_pkey'
    `;

    if (Array.isArray(uniqueConstraints) && uniqueConstraints.length > 0) {
      (uniqueConstraints as any[]).forEach((uc: any) => {
        console.log(
          `   ✅ ユニーク制約: ${uc.constraint_name} (${uc.column_name})`
        );
      });
    } else {
      console.log("   ⚠️  ユニーク制約が見つかりません（複合ユニーク制約は別途確認）");
    }

    console.log("\n✅ 見積明細テーブルの確認が完了しました");
  } catch (error) {
    console.error("\n❌ 確認中にエラーが発生しました:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyTable()
  .then(() => {
    console.log("\nスクリプトを正常に終了しました");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nスクリプト実行エラー:", error);
    process.exit(1);
  });

