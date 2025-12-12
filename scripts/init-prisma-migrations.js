// Prismaマイグレーション履歴を初期化するスクリプト
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initMigrations() {
  try {
    console.log('=== Prismaマイグレーション履歴の初期化 ===\n');
    
    // _prisma_migrationsテーブルを作成
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMP,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP,
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);
    
    console.log('✅ _prisma_migrationsテーブルを作成しました');
    
    // 既存のマイグレーションファイルを確認
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    
    if (fs.existsSync(migrationsDir)) {
      const migrations = fs.readdirSync(migrationsDir)
        .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory())
        .sort();
      
      console.log('\n見つかったマイグレーションファイル:');
      migrations.forEach(migration => {
        console.log(`  - ${migration}`);
      });
      
      // 既存のマイグレーションを解決済みとしてマーク
      for (const migration of migrations) {
        const migrationName = migration;
        const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
        
        if (fs.existsSync(migrationPath)) {
          const migrationSql = fs.readFileSync(migrationPath, 'utf8');
          const checksum = require('crypto').createHash('sha256').update(migrationSql).digest('hex');
          
          // マイグレーションが既に存在するか確認
          const existing = await prisma.$queryRawUnsafe(`
            SELECT id FROM _prisma_migrations WHERE migration_name = $1
          `, migrationName);
          
          if (!existing || existing.length === 0) {
            const id = require('crypto').randomUUID();
            await prisma.$executeRawUnsafe(`
              INSERT INTO _prisma_migrations (
                id, checksum, migration_name, started_at, finished_at, applied_steps_count
              ) VALUES (
                $1, $2, $3, NOW(), NOW(), 1
              )
            `, id, checksum, migrationName);
            
            console.log(`✅ マイグレーション "${migrationName}" を解決済みとしてマークしました`);
          } else {
            console.log(`ℹ️  マイグレーション "${migrationName}" は既に存在します`);
          }
        }
      }
    }
    
    // 最終確認
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY started_at
    `;
    
    console.log('\n現在のマイグレーション履歴:');
    console.log(migrations);
    
    console.log('\n✅ マイグレーション履歴の初期化が完了しました');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initMigrations();

