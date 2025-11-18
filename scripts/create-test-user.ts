/**
 * テスト用ユーザーを作成するスクリプト
 * 実行方法: npx tsx scripts/create-test-user.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local ファイルを読み込む
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const password = "password123";
  
  console.log("パスワードをハッシュ化中...");
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`ハッシュ化されたパスワード: ${hashedPassword}`);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name: "管理者",
        role: UserRole.ADMIN,
      },
      create: {
        email,
        name: "管理者",
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });

    console.log("\nテストユーザーを作成しました:");
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${user.role}`);
    console.log(`ID: ${user.id}`);
    
    // パスワード検証テスト
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`\nパスワード検証テスト: ${isValid ? "成功" : "失敗"}`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    throw error;
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

