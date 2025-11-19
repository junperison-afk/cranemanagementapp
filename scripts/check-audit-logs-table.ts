/**
 * audit_logsテーブルの存在と構造を確認するスクリプト
 * 実行方法: npx tsx scripts/check-audit-logs-table.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local ファイルを読み込む
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("audit_logsテーブルを確認中...\n");

    // 1. テーブルの存在確認（Prisma経由でクエリを試みる）
    try {
      const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM audit_logs
      `;
      console.log("✓ audit_logsテーブルが存在します");
      console.log(`  現在のレコード数: ${count[0].count}\n`);
    } catch (error: any) {
      console.error("✗ audit_logsテーブルが見つかりません");
      console.error(`  エラー: ${error.message}\n`);
      return;
    }

    // 2. テーブル構造の確認
    console.log("テーブル構造を確認中...\n");
    const tableInfo = await prisma.$queryRaw<Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>>`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'audit_logs'
      ORDER BY ordinal_position
    `;

    console.log("カラム一覧:");
    tableInfo.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL可' : 'NOT NULL';
      const defaultVal = col.column_default ? ` (デフォルト: ${col.column_default})` : '';
      console.log(`  - ${col.column_name}: ${col.data_type} (${nullable})${defaultVal}`);
    });

    // 3. インデックスの確認
    console.log("\nインデックスを確認中...\n");
    const indexes = await prisma.$queryRaw<Array<{
      indexname: string;
      indexdef: string;
    }>>`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'audit_logs'
      AND indexname != 'audit_logs_pkey'
    `;

    if (indexes.length > 0) {
      console.log("インデックス一覧:");
      indexes.forEach(idx => {
        console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
      });
    } else {
      console.log("警告: インデックスが見つかりません");
    }

    // 4. 外部キー制約の確認
    console.log("\n外部キー制約を確認中...\n");
    const foreignKeys = await prisma.$queryRaw<Array<{
      constraint_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      on_delete: string;
    }>>`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule AS on_delete
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'audit_logs'
    `;

    if (foreignKeys.length > 0) {
      console.log("外部キー制約一覧:");
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.constraint_name}:`);
        console.log(`    カラム: ${fk.column_name}`);
        console.log(`    参照先: ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        console.log(`    削除時動作: ${fk.on_delete}`);
      });
    } else {
      console.log("警告: 外部キー制約が見つかりません");
    }

    // 5. Enum型の確認
    console.log("\nEnum型を確認中...\n");
    const enumType = await prisma.$queryRaw<Array<{
      enumlabel: string;
    }>>`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (
        SELECT oid
        FROM pg_type
        WHERE typname = 'AuditAction'
      )
      ORDER BY enumsortorder
    `;

    if (enumType.length > 0) {
      console.log("AuditAction enum値:");
      enumType.forEach(val => {
        console.log(`  - ${val.enumlabel}`);
      });
    } else {
      console.log("警告: AuditAction enum型が見つかりません");
    }

    // 6. 実際にPrismaからデータを取得できるかテスト
    console.log("\nPrisma Clientからのアクセステスト...\n");
    try {
      const testQuery = await prisma.auditLog.findMany({
        take: 1,
      });
      console.log("✓ Prisma Clientからアクセス可能");
    } catch (error: any) {
      console.error("✗ Prisma Clientからのアクセスに失敗");
      console.error(`  エラー: ${error.message}`);
      console.error("\n注意: Prisma Clientを再生成する必要がある可能性があります");
      console.error("  npx prisma generate を実行してください");
    }

    console.log("\n✓ 確認完了");

  } catch (error: any) {
    console.error("\n✗ エラーが発生しました:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

