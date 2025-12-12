// Prismaコマンドの問題を調査するスクリプト
require('dotenv').config();

console.log('=== Prisma接続設定の調査 ===\n');

// 1. 環境変数の確認
console.log('1. 環境変数の確認:');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  // パスワードをマスク
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`DATABASE_URL: ${maskedUrl}`);
  
  // 接続プーリングの使用を確認
  if (dbUrl.includes('pooler') || dbUrl.includes('6543')) {
    console.log('⚠️  接続プーリング（pgbouncer）を使用しています');
    console.log('   これがPrisma migrateコマンドの問題の原因かもしれません');
  }
  
  // ポート番号を確認
  const portMatch = dbUrl.match(/:(\d+)\//);
  if (portMatch) {
    const port = portMatch[1];
    console.log(`ポート番号: ${port}`);
    if (port === '6543') {
      console.log('⚠️  ポート6543（接続プーリング）を使用しています');
      console.log('   Prisma migrateコマンドは直接接続（ポート5432）を推奨します');
    }
  }
} else {
  console.log('❌ DATABASE_URLが設定されていません');
}

console.log('\n2. Prisma Clientの接続テスト:');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('接続をテストしています...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma Client接続成功');
    console.log('結果:', result);
    
    // 接続情報を取得
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_address,
        inet_server_port() as server_port,
        version() as version
    `;
    console.log('\nデータベース情報:');
    console.log(dbInfo);
    
  } catch (error) {
    console.error('❌ Prisma Client接続エラー:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().then(() => {
  console.log('\n3. 推奨される解決策:');
  console.log('   - Prisma migrateコマンドを使用する場合は、直接接続（ポート5432）を使用');
  console.log('   - 接続プーリング（ポート6543）はアプリケーション実行時のみ使用');
  console.log('   - または、直接SQLを実行してマイグレーションを適用');
});

