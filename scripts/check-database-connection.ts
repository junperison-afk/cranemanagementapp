/**
 * データベース接続を確認するスクリプト
 * 実行方法: npx tsx scripts/check-database-connection.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local ファイルを読み込む
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("データベース接続を確認中...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "設定されています" : "設定されていません");
    
    if (!process.env.DATABASE_URL) {
      console.error("エラー: DATABASE_URL環境変数が設定されていません");
      console.error(".env.localファイルにDATABASE_URLを設定してください");
      return;
    }

    // データベース接続テスト
    await prisma.$connect();
    console.log("✓ データベース接続成功");

    // ユーザーテーブルにアクセスできるか確認
    const userCount = await prisma.user.count();
    console.log(`✓ ユーザーテーブルにアクセス可能（ユーザー数: ${userCount}）`);

    // admin@example.com が存在するか確認
    const user = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });

    if (user) {
      console.log("\n✓ ユーザーが見つかりました:");
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  ID: ${user.id}`);
    } else {
      console.log("\n✗ ユーザーが見つかりませんでした");
      console.log("  Email: admin@example.com のユーザーが存在しません");
      console.log("  npm run create-test-user を実行してユーザーを作成してください");
    }
  } catch (error: any) {
    console.error("\n✗ エラーが発生しました:");
    console.error(error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.error("\n考えられる原因:");
      console.error("1. DATABASE_URLが正しく設定されていない");
      console.error("2. データベースサーバーが起動していない");
      console.error("3. Supabaseのファイアウォール設定で、ローカルIPアドレスからの接続が許可されていない");
      console.error("\n解決方法:");
      console.error("1. .env.localファイルのDATABASE_URLを確認");
      console.error("2. Supabaseダッシュボードの「Settings」→「Database」→「Connection Pooling」で直接接続用のURLを確認");
      console.error("3. Supabaseのファイアウォール設定で、ローカルIPアドレスを許可");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

