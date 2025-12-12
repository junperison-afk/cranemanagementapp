// 直接接続を使用してPrismaマイグレーションを実行するスクリプト
require('dotenv').config();

console.log('=== Prismaマイグレーション実行（直接接続用） ===\n');

// .envファイルから直接接続用のURLを取得
// DATABASE_URL_DIRECTが設定されている場合はそれを使用
// なければ、DATABASE_URLからポート番号を5432に変更

let directUrl = process.env.DATABASE_URL_DIRECT;

if (!directUrl && process.env.DATABASE_URL) {
  // ポート6543を5432に変更、poolerをdbに変更
  directUrl = process.env.DATABASE_URL
    .replace(/:6543\//, ':5432/')
    .replace(/pooler\.supabase\.com/, 'supabase.co')
    .replace(/postgres\.([^.]+)\./, 'postgres@')
    .replace(/\?pgbouncer=true.*$/, '')
    .replace(/&connect_timeout=\d+/, '')
    .replace(/&pool_timeout=\d+/, '');
  
  // ユーザー名の形式を修正（postgres.xxxxx → postgres）
  directUrl = directUrl.replace(/postgres@/, 'postgres:');
  
  console.log('⚠️  DATABASE_URL_DIRECTが設定されていません');
  console.log('   推奨: .envファイルに直接接続用のURLを設定してください');
  console.log(`   例: DATABASE_URL_DIRECT=${directUrl}\n`);
}

if (!directUrl) {
  console.error('❌ DATABASE_URLまたはDATABASE_URL_DIRECTが設定されていません');
  process.exit(1);
}

// パスワードをマスクして表示
const maskedUrl = directUrl.replace(/:[^:@]+@/, ':****@');
console.log(`直接接続URL: ${maskedUrl}\n`);

// 環境変数を一時的に変更
const originalUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = directUrl;

console.log('直接接続を使用してPrismaマイグレーションを実行します...\n');

// Prisma CLIを実行
const { spawn } = require('child_process');

const prismaProcess = spawn('npx', ['prisma', 'migrate', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: directUrl,
  },
});

prismaProcess.on('close', (code) => {
  // 元のURLに戻す
  if (originalUrl) {
    process.env.DATABASE_URL = originalUrl;
  }
  
  if (code === 0) {
    console.log('\n✅ マイグレーションが正常に完了しました');
  } else {
    console.log(`\n❌ マイグレーションがエラーで終了しました（コード: ${code}）`);
    process.exit(code);
  }
});

