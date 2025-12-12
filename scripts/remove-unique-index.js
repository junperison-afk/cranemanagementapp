// ユニークインデックスを削除するスクリプト
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeUniqueIndex() {
  try {
    console.log('=== ユニークインデックスの削除 ===\n');
    
    // ユニークインデックスを削除
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS "contracts_salesOpportunityId_key" CASCADE;
    `);
    
    console.log('✅ ユニークインデックス "contracts_salesOpportunityId_key" を削除しました');
    
    // 削除を確認
    const uniqueIndexes = await prisma.$queryRaw`
      SELECT 
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'contracts'
      AND a.attname = 'salesOpportunityId'
      AND ix.indisunique = true
    `;
    
    console.log('\n削除後の確認:');
    console.log(uniqueIndexes);
    
    if (uniqueIndexes.length === 0) {
      console.log('✅ salesOpportunityIdのユニークインデックスは削除されました');
    } else {
      console.log('⚠️  ユニークインデックスがまだ存在します');
    }
    
    // 非ユニークインデックスが存在することを確認
    const nonUniqueIndexes = await prisma.$queryRaw`
      SELECT 
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'contracts'
      AND a.attname = 'salesOpportunityId'
      AND ix.indisunique = false
    `;
    
    console.log('\n非ユニークインデックス:');
    console.log(nonUniqueIndexes);
    
    if (nonUniqueIndexes.length === 0) {
      console.log('⚠️  非ユニークインデックスが存在しません。作成します...');
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "contracts_salesOpportunityId_idx" ON "contracts"("salesOpportunityId");
      `);
      console.log('✅ 非ユニークインデックスを作成しました');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeUniqueIndex();

