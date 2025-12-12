// マイグレーションを直接実行するスクリプト
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('マイグレーションを直接実行しています...');
    
    // マイグレーションSQLを実行
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_salesOpportunityId_key";
    `);
    
    console.log('✅ マイグレーションSQLを実行しました');
    
    // 制約が削除されたことを確認
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'contracts'::regclass
      AND conname = 'contracts_salesOpportunityId_key'
    `;
    
    console.log('\n制約の確認:');
    console.log(constraints);
    
    if (!constraints || constraints.length === 0) {
      console.log('✅ contracts_salesOpportunityId_key制約は削除されています');
    } else {
      console.log('⚠️ 制約がまだ存在します');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

