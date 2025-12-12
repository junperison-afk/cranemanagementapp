import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// .envファイルを読み込む
config();

const prisma = new PrismaClient();

async function main() {
  const sqlPath = join(process.cwd(), "migrations", "remove_contract_unique_constraint.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  
  console.log("実行するSQL:");
  console.log(sql);
  console.log("\nマイグレーションを実行します...");
  
  // SQLを実行
  await prisma.$executeRawUnsafe(sql);
  
  console.log("マイグレーションが正常に完了しました！");
}

main()
  .catch((e) => {
    console.error("エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

