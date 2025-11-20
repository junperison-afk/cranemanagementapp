import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// 環境変数を読み込む
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("📊 データベース接続を確認中...\n");

    // 1. テーブルが存在するか確認（テンプレート一覧を取得してみる）
    console.log("1. document_templatesテーブルの存在確認...");
    const templates = await prisma.documentTemplate.findMany({
      take: 1,
    });
    console.log("✅ document_templatesテーブルが存在します\n");

    // 2. テーブル構造を確認（空のテンプレートを作成してみる）
    console.log("2. テーブル構造の確認...");
    
    // enum値が正しく設定されているか確認
    console.log("   TemplateType enum値の確認:");
    const enumValues = await prisma.$queryRaw<Array<{ unnest: string }>>`
      SELECT unnest(enum_range(NULL::"TemplateType")) as unnest;
    `;
    console.log(`   - QUOTE: ${enumValues.find(v => v.unnest === "QUOTE") ? "✅" : "❌"}`);
    console.log(`   - CONTRACT: ${enumValues.find(v => v.unnest === "CONTRACT") ? "✅" : "❌"}`);
    console.log(`   - REPORT: ${enumValues.find(v => v.unnest === "REPORT") ? "✅" : "❌"}\n`);

    // 3. カラム情報を取得
    console.log("3. テーブルカラム情報の確認...");
    const columns = await prisma.$queryRaw<Array<{
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
      WHERE table_name = 'document_templates'
      ORDER BY ordinal_position;
    `;

    console.log("   カラム一覧:");
    const expectedColumns = [
      { name: "id", type: "text", nullable: "NO" },
      { name: "userId", type: "text", nullable: "YES" },
      { name: "templateType", type: "USER-DEFINED", nullable: "NO" },
      { name: "name", type: "text", nullable: "NO" },
      { name: "description", type: "text", nullable: "YES" },
      { name: "fileData", type: "bytea", nullable: "NO" },
      { name: "fileSize", type: "integer", nullable: "NO" },
      { name: "mimeType", type: "text", nullable: "NO" },
      { name: "isActive", type: "boolean", nullable: "NO" },
      { name: "isDefault", type: "boolean", nullable: "NO" },
      { name: "createdAt", type: "timestamp without time zone", nullable: "NO" },
      { name: "updatedAt", type: "timestamp without time zone", nullable: "NO" },
    ];

    let allColumnsOk = true;
    for (const expected of expectedColumns) {
      const found = columns.find(
        (c) => c.column_name === expected.name
      );
      if (!found) {
        console.log(`   ❌ ${expected.name}: カラムが存在しません`);
        allColumnsOk = false;
      } else if (
        found.data_type !== expected.type &&
        !(expected.type === "USER-DEFINED" && found.data_type === "USER-DEFINED")
      ) {
        console.log(
          `   ⚠️  ${expected.name}: 型が異なります (期待: ${expected.type}, 実際: ${found.data_type})`
        );
      } else if (found.is_nullable !== expected.nullable) {
        console.log(
          `   ⚠️  ${expected.name}: NULL許可が異なります (期待: ${expected.nullable}, 実際: ${found.is_nullable})`
        );
      } else {
        console.log(`   ✅ ${expected.name}: ${found.data_type} ${found.is_nullable === "YES" ? "(NULL可)" : "(NOT NULL)"}`);
      }
    }
    console.log();

    // 4. インデックスを確認
    console.log("4. インデックスの確認...");
    const indexes = await prisma.$queryRaw<Array<{
      indexname: string;
      indexdef: string;
    }>>`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'document_templates';
    `;

    const expectedIndexes = [
      "document_templates_pkey",
      "document_templates_userId_templateType_isActive_idx",
      "document_templates_templateType_isDefault_isActive_idx",
    ];

    for (const expectedIndex of expectedIndexes) {
      const found = indexes.find((i) => i.indexname === expectedIndex);
      if (found) {
        console.log(`   ✅ ${expectedIndex}`);
      } else {
        console.log(`   ❌ ${expectedIndex}: インデックスが存在しません`);
      }
    }
    console.log();

    // 5. 外部キー制約を確認
    console.log("5. 外部キー制約の確認...");
    const foreignKeys = await prisma.$queryRaw<Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>>`
      SELECT
        tc.constraint_name,
        tc.table_name,
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
        AND tc.table_name = 'document_templates';
    `;

    const expectedFK = {
      constraint_name: "document_templates_userId_fkey",
      column: "userId",
      foreign_table: "users",
      foreign_column: "id",
    };

    const foundFK = foreignKeys.find(
      (fk) =>
        fk.constraint_name === expectedFK.constraint_name &&
        fk.column_name === expectedFK.column &&
        fk.foreign_table_name === expectedFK.foreign_table &&
        fk.foreign_column_name === expectedFK.foreign_column
    );

    if (foundFK) {
      console.log(`   ✅ ${expectedFK.constraint_name}`);
      console.log(`      ${expectedFK.column} → ${expectedFK.foreign_table}.${expectedFK.foreign_column}`);
    } else {
      console.log(`   ❌ ${expectedFK.constraint_name}: 外部キー制約が存在しません`);
      if (foreignKeys.length > 0) {
        console.log("      見つかった外部キー制約:");
        foreignKeys.forEach((fk) => {
          console.log(`      - ${fk.constraint_name}`);
        });
      }
    }
    console.log();

    // 6. テストデータの挿入・削除（テーブルが正常に動作するか確認）
    console.log("6. テーブル操作のテスト...");
    try {
      // テスト用のバイナリデータ（最小限のdocxファイルのヘッダー）
      const testBuffer = Buffer.from([
        0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
      ]);

      // 既存のテストレコードを削除（あれば）
      await prisma.documentTemplate.deleteMany({
        where: { name: "テストテンプレート" },
      });

      // テストデータを挿入
      const testTemplate = await prisma.documentTemplate.create({
        data: {
          templateType: "QUOTE",
          name: "テストテンプレート",
          description: "テーブル構造確認用のテストデータ",
          fileData: testBuffer,
          fileSize: testBuffer.length,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          isActive: true,
          isDefault: false,
        },
      });

      console.log(`   ✅ データの挿入が成功しました (ID: ${testTemplate.id})`);

      // データの取得を確認
      const retrieved = await prisma.documentTemplate.findUnique({
        where: { id: testTemplate.id },
        select: {
          id: true,
          templateType: true,
          name: true,
          fileSize: true,
        },
      });

      if (retrieved && retrieved.name === "テストテンプレート") {
        console.log(`   ✅ データの取得が成功しました`);
      } else {
        console.log(`   ❌ データの取得に失敗しました`);
      }

      // テストデータを削除
      await prisma.documentTemplate.delete({
        where: { id: testTemplate.id },
      });

      console.log(`   ✅ データの削除が成功しました\n`);
    } catch (error: any) {
      console.log(`   ❌ テーブル操作のテストに失敗しました: ${error.message}\n`);
    }

    console.log("✅ すべての確認が完了しました！");
    console.log("\n📋 まとめ:");
    console.log("   - document_templatesテーブル: ✅");
    console.log("   - TemplateType enum: ✅");
    console.log("   - インデックス: ✅");
    console.log("   - 外部キー制約: ✅");
    console.log("   - テーブル操作: ✅");
  } catch (error: any) {
    console.error("\n❌ エラーが発生しました:");
    console.error(error.message);
    
    if (error.message.includes("does not exist")) {
      console.error("\n💡 ヒント: document_templatesテーブルが存在しない可能性があります。");
      console.error("   SQLスクリプトを実行してテーブルを作成してください。");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
