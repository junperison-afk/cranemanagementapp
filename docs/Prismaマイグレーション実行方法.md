# Prismaマイグレーション実行方法

## 問題点

Prismaの`migrate`コマンドが終わらない問題が発生する場合、**接続プーリング（pgbouncer）**を使用していることが原因です。

- **接続プーリング（ポート6543）**: アプリケーション実行時用
- **直接接続（ポート5432）**: マイグレーション実行時用

## 解決策

### 方法1: 直接接続用のDATABASE_URLを一時的に設定

マイグレーション実行時のみ、直接接続用のURLを使用します：

```bash
# 直接接続用のURLを設定（ポート5432）
# 例: postgresql://postgres:[PASSWORD]@db.nypyvzqfmessxboiwfka.supabase.co:5432/postgres
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.nypyvzqfmessxboiwfka.supabase.co:5432/postgres"

# マイグレーションを実行
npx prisma migrate dev

# 実行後、元の接続プーリング用URLに戻す
unset DATABASE_URL  # または .envファイルの値を元に戻す
```

### 方法2: 直接SQLを実行（推奨）

Prismaのマイグレーションコマンドを使わず、直接SQLを実行する方法：

```bash
# マイグレーションSQLを直接実行
node scripts/apply-migration-directly.js
```

この方法は、接続プーリング環境でも確実に動作します。

### 方法3: .envファイルに2つのURLを用意

`.env`ファイルに直接接続用のURLを追加：

```env
# アプリケーション実行時用（接続プーリング）
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=15

# マイグレーション実行時用（直接接続）
DATABASE_URL_DIRECT=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

マイグレーション実行時：

```bash
# 一時的に直接接続用URLを使用
export DATABASE_URL=$DATABASE_URL_DIRECT
npx prisma migrate dev
# 実行後、.envファイルの値を元に戻す
```

## 現在の状況

既に`contracts_salesOpportunityId_key`制約は削除済みです。
直接SQLを実行してマイグレーションを適用したため、Prismaの`migrate`コマンドを実行する必要はありません。

## 今後のマイグレーション実行方法

1. **直接SQLを実行する方法（推奨）**:
   - `prisma/migrations/`内のSQLファイルを確認
   - `scripts/apply-migration-directly.js`を参考に、直接SQLを実行

2. **Prisma migrateコマンドを使用する場合**:
   - 直接接続用のURL（ポート5432）を一時的に設定
   - `npx prisma migrate dev`を実行
   - 実行後、接続プーリング用URLに戻す

