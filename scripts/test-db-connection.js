// .envファイルを読み込む
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('データベース接続をテストしています...');
    
    // 簡単なクエリで接続を確認
    const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user`;
    
    console.log('✅ データベース接続成功！');
    console.log('データベース情報:');
    console.log(result);
    
    // contractsテーブルが存在するか確認
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contracts'
      ) as exists
    `;
    
    console.log('\ncontractsテーブルの存在確認:');
    console.log(tableExists);
    
    // salesOpportunityIdの制約を確認
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'contracts'::regclass
      AND conname = 'contracts_salesOpportunityId_key'
    `;
    
    console.log('\nsalesOpportunityIdのユニーク制約:');
    console.log(constraints);
    
  } catch (error) {
    console.error('❌ データベース接続エラー:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

