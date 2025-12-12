import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// .envファイルを読み込む
config();

const prisma = new PrismaClient();

async function runMigration(fileName: string) {
  const sqlPath = join(process.cwd(), "migrations", fileName);
  const sql = readFileSync(sqlPath, "utf-8");
  
  console.log(`\n実行するSQL: ${fileName}`);
  console.log("=" .repeat(50));
  console.log(sql);
  console.log("=" .repeat(50));
  console.log("\nマイグレーションを実行します...");
  
  try {
    // SQLを実行
    await prisma.$executeRawUnsafe(sql);
    console.log(`✅ ${fileName} が正常に完了しました！`);
  } catch (error) {
    console.error(`❌ ${fileName} の実行中にエラーが発生しました:`, error);
    throw error;
  }
}

async function main() {
  try {
    // 1. ユニーク制約の削除
    await runMigration("remove_contract_unique_constraint.sql");
    
    // 2. createdByIdカラムの追加（オプション）
    // await runMigration("add_contract_created_by.sql");
    
    console.log("\n✅ すべてのマイグレーションが正常に完了しました！");
  } catch (e) {
    console.error("エラー:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

