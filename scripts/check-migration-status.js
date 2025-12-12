// マイグレーション状態を確認するスクリプト
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  try {
    console.log('=== マイグレーション状態の確認 ===\n');
    
    // _prisma_migrationsテーブルの存在確認
    const migrationsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      ) as exists
    `;
    
    console.log('1. _prisma_migrationsテーブルの存在:');
    console.log(migrationsTableExists);
    
    if (migrationsTableExists[0].exists) {
      // マイグレーション履歴を取得
      const migrations = await prisma.$queryRaw`
        SELECT 
          migration_name,
          started_at,
          finished_at,
          applied_steps_count
        FROM _prisma_migrations
        ORDER BY started_at DESC
        LIMIT 10
      `;
      
      console.log('\n2. マイグレーション履歴（最新10件）:');
      console.log(migrations);
    } else {
      console.log('\n⚠️  _prisma_migrationsテーブルが存在しません');
      console.log('   Prismaのマイグレーションシステムが初期化されていない可能性があります');
    }
    
    // contractsテーブルの制約を確認
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'contracts'::regclass
      AND contype = 'u'
      AND (
        conname LIKE '%salesOpportunityId%'
        OR pg_get_constraintdef(oid) LIKE '%salesOpportunityId%'
      )
    `;
    
    console.log('\n3. contractsテーブルのユニーク制約（salesOpportunityId関連）:');
    console.log(constraints);
    
    if (constraints.length === 0) {
      console.log('✅ salesOpportunityIdのユニーク制約は削除されています');
    } else {
      console.log('⚠️  salesOpportunityIdのユニーク制約がまだ存在します');
    }
    
    // 推奨される対応
    console.log('\n4. 推奨される対応:');
    if (constraints.length === 0) {
      console.log('✅ 制約は既に削除されているため、マイグレーション履歴を手動で更新するか、');
      console.log('   マイグレーションをスキップして問題ありません');
    } else {
      console.log('⚠️  制約がまだ存在するため、直接SQLで削除する必要があります');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();

