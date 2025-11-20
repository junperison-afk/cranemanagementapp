# VercelとSupabaseデータベース接続手順書

## 概要

このドキュメントでは、Next.jsアプリケーションをVercelにデプロイし、Supabase（PostgreSQL）データベースに接続する方法を説明します。この構成は、サーバーレス環境でのデータベース接続に最適化されています。

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 14+ (App Router)
- **データベース**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **デプロイ先**: Vercel
- **言語**: TypeScript

## 1. 前提条件

- Node.js 18以上がインストールされていること
- Supabaseアカウント（https://supabase.com）
- Vercelアカウント（https://vercel.com）
- Gitリポジトリ（GitHub、GitLab、Bitbucketなど）

## 2. Supabaseの設定

### 2-1. プロジェクトの作成

1. Supabaseダッシュボード（https://app.supabase.com）にログイン
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワード、リージョンを設定
4. プロジェクトが作成されるまで待機（通常1〜2分）

### 2-2. 接続情報の取得

#### 直接接続用URL（開発環境用）

1. Supabaseダッシュボードでプロジェクトを選択
2. 「Settings」→「Database」を開く
3. 「Connection string」セクションで「URI」を選択
4. 接続文字列をコピー（ポート5432）

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

#### 接続プーリング用URL（本番環境・Vercel用）

**重要**: Vercelなどのサーバーレス環境では、接続プーリング用URL（ポート6543）を使用する必要があります。

1. 「Connection string」セクションで「Connection pooling」を選択
2. 「Transaction pooler」を選択
3. 接続文字列をコピー（ポート6543）

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**注意事項:**
- `[PASSWORD]` は実際のデータベースパスワードに置き換える必要があります
- 接続プーリングを使用する場合、プリペアドステートメントエラーを防ぐため、接続文字列の末尾に `&connect_timeout=15&pool_timeout=15` を追加することを推奨します

**完全な接続文字列の例:**
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=15
```

### 2-3. データベースパスワードの確認・設定

1. 「Settings」→「Database」→「Database password」を開く
2. パスワードを確認、または「Reset database password」で再設定
3. 接続文字列の `[PASSWORD]` 部分を実際のパスワードに置き換える

## 3. プロジェクトのセットアップ

### 3-1. 必要なパッケージのインストール

```bash
npm install @prisma/client
npm install -D prisma
```

### 3-2. Prismaの初期化

```bash
npx prisma init
```

このコマンドで以下が作成されます：
- `prisma/schema.prisma` - Prismaスキーマファイル
- `.env` - 環境変数ファイル（既に存在する場合は追加されません）

### 3-3. Prismaスキーマの設定

`prisma/schema.prisma` を以下のように設定します：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ここにモデル定義を追加
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### 3-4. 環境変数の設定（ローカル開発環境）

`.env` ファイル（または `.env.local`）に以下を追加：

```env
# 開発環境用（直接接続、ポート5432）
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth.js用（開発環境）
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**NEXTAUTH_SECRETの生成方法:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

または、オンラインツール（https://generate-secret.vercel.app/32）を使用

### 3-5. Prismaクライアントの生成

```bash
npx prisma generate
```

### 3-6. データベーススキーマの適用

```bash
# 開発環境でスキーマを適用（マイグレーションファイルを作成）
npx prisma migrate dev --name init

# または、マイグレーションファイルを作成せずに直接適用（開発時のみ）
npx prisma db push
```

## 4. Prismaクライアントの実装

### 4-1. Prismaクライアントのシングルトン実装

`lib/prisma.ts` を作成します：

```typescript
import { PrismaClient } from "@prisma/client";

// Prismaクライアントのシングルトンインスタンス
// Next.jsの開発環境でホットリロード時に複数のインスタンスが作成されるのを防ぐ

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 接続プーリング環境でのプリペアドステートメントエラーを防ぐため、
// 接続URLに適切なパラメータを追加
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // pgbouncerを使用している場合、接続パラメータを追加
  if (url.includes("pgbouncer=true")) {
    // 既にパラメータがある場合は追加しない
    if (url.includes("?")) {
      // 既存のパラメータがある場合、必要なパラメータを追加
      if (!url.includes("connect_timeout")) {
        return `${url}&connect_timeout=15`;
      }
      return url;
    } else {
      return `${url}?connect_timeout=15`;
    }
  }
  
  return url;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**重要なポイント:**
- シングルトンパターンを使用して、開発環境でのホットリロード時に複数のPrismaインスタンスが作成されるのを防ぎます
- 接続プーリング環境（pgbouncer）でのプリペアドステートメントエラーを防ぐため、接続タイムアウトパラメータを追加します
- 本番環境では `globalThis` に保存しないため、メモリリークを防ぎます

### 4-2. APIルートでの使用例

`app/api/example/route.ts` の例：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: データ取得
export async function GET(request: NextRequest) {
  try {
    const data = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: データ作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "データの作成に失敗しました" },
      { status: 500 }
    );
  }
}
```

### 4-3. Server Componentsでの使用例

`app/users/page.tsx` の例：

```typescript
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <h1>ユーザー一覧</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 5. package.jsonの設定

`package.json` に以下のスクリプトを追加：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

**重要なポイント:**
- `build` スクリプトに `prisma generate` を追加（Vercelでのビルド時にPrismaクライアントを生成）
- `postinstall` スクリプトに `prisma generate` を追加（依存関係インストール後に自動生成）

## 6. Vercelの設定

### 6-1. vercel.jsonの作成（オプション）

プロジェクトルートに `vercel.json` を作成：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

**regionsの設定:**
- `hnd1`: 東京（日本）
- `nrt1`: 東京（日本、別のリージョン）
- `sfo1`: サンフランシスコ（米国）
- その他のリージョンは [Vercelのドキュメント](https://vercel.com/docs/concepts/edge-network/regions) を参照

### 6-2. Next.js設定の確認

`next.config.js` の例：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
```

## 7. Vercelへのデプロイ

### 7-1. プロジェクトのインポート

1. Vercelダッシュボード（https://vercel.com）にログイン
2. 「Add New...」→「Project」をクリック
3. Gitリポジトリを選択または検索
4. プロジェクトをインポート

### 7-2. 環境変数の設定

1. プロジェクト設定画面で「Environment Variables」を開く
2. 以下の環境変数を追加：

```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=15
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[生成したシークレットキー]
```

**重要:**
- `DATABASE_URL` は必ず**接続プーリング用**（ポート**6543**）を使用してください
- 直接接続用（ポート5432）では、サーバーレス環境（Vercel）で接続できない場合があります
- `NEXTAUTH_URL` は本番環境のURLに設定してください（末尾にスラッシュを付けない）

3. **Environment**を選択：
   - **Production**（本番環境）
   - **Preview**（プレビュー環境、オプション）
   - **Development**（開発環境、オプション）

4. 「Save」をクリック

### 7-3. デプロイの実行

1. プロジェクト設定画面で「Deploy」をクリック
2. ビルドログを確認
3. デプロイが完了すると、`https://[プロジェクト名].vercel.app` のURLが発行されます

### 7-4. データベースマイグレーションの実行

Vercelではデプロイ時に自動でPrismaクライアントが生成されますが、スキーマの適用は手動で行う必要があります。

**方法1: ローカルから実行（推奨）**

```bash
# 環境変数を設定（一時的に）
export DATABASE_URL="[本番環境のDATABASE_URL]"

# マイグレーション実行
npx prisma migrate deploy

# または、初回の場合
npx prisma db push
```

**方法2: SupabaseのSQL Editorを使用**

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. `prisma/migrations` フォルダ内のSQLファイルを実行

**方法3: package.jsonのビルドスクリプトに組み込む（非推奨）**

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**注意:** 本番環境でのマイグレーション実行は慎重に行ってください。データ損失のリスクがあります。

## 8. トラブルシューティング

### 8-1. データベース接続エラー

**症状:** `Can't reach database server` などのエラー

**解決方法:**
1. `DATABASE_URL` が接続プーリング用（ポート6543）であることを確認
2. 接続文字列に `pgbouncer=true` パラメータが含まれていることを確認
3. データベースパスワードが正しいことを確認
4. Supabaseのファイアウォール設定でIPアドレス制限がないことを確認

### 8-2. プリペアドステートメントエラー

**症状:** `prepared statement "s0" does not exist` などのエラー

**解決方法:**
1. 接続文字列に `pgbouncer=true` パラメータが含まれていることを確認
2. `lib/prisma.ts` で接続タイムアウトパラメータが追加されていることを確認
3. 接続文字列の末尾に `&connect_timeout=15&pool_timeout=15` を追加

### 8-3. Prismaクライアント生成エラー

**症状:** ビルド時に `@prisma/client` が見つからないエラー

**解決方法:**
1. `package.json` の `build` スクリプトに `prisma generate` が含まれていることを確認
2. `postinstall` スクリプトに `prisma generate` が含まれていることを確認
3. ローカルで `npm install` を実行してから再デプロイ

### 8-4. 接続数制限エラー

**症状:** `too many connections` などのエラー

**解決方法:**
1. 接続プーリングを使用していることを確認（ポート6543）
2. Prismaクライアントがシングルトンパターンで実装されていることを確認
3. 不要な接続を適切にクローズしていることを確認

### 8-5. 環境変数が認識されない

**症状:** 環境変数が `undefined` になる

**解決方法:**
1. Vercelの環境変数設定を再確認
2. 環境変数の名前が正確か確認（大文字・小文字を区別）
3. 環境変数更新後に再デプロイを実行（環境変数の変更は再デプロイ後に反映されます）

## 9. ベストプラクティス

### 9-1. 接続管理

- **シングルトンパターンの使用**: Prismaクライアントは必ずシングルトンで実装する
- **接続プーリングの活用**: サーバーレス環境では接続プーリング（pgbouncer）を使用する
- **適切なタイムアウト設定**: 接続タイムアウトを設定して、長時間接続を防ぐ

### 9-2. エラーハンドリング

- **try-catch文の使用**: すべてのデータベース操作をtry-catchで囲む
- **適切なエラーメッセージ**: ユーザーに分かりやすいエラーメッセージを返す
- **ログの記録**: エラーをログに記録して、デバッグを容易にする

### 9-3. パフォーマンス

- **必要なデータのみ取得**: `select` や `include` を適切に使用して、必要なデータのみ取得する
- **ページネーション**: 大量のデータを取得する場合は、ページネーションを実装する
- **インデックスの活用**: よく検索されるカラムにインデックスを設定する

### 9-4. セキュリティ

- **環境変数の管理**: 機密情報は環境変数で管理し、Gitにコミットしない
- **SQLインジェクション対策**: Prismaを使用することで、SQLインジェクションを防ぐ
- **認証・認可**: データベース操作の前に、適切な認証・認可を実装する

## 10. 参考リンク

- [Prisma公式ドキュメント](https://www.prisma.io/docs)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Next.js公式ドキュメント](https://nextjs.org/docs)
- [Prisma + Vercel デプロイガイド](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## 11. チェックリスト

デプロイ前に以下を確認してください：

- [ ] Supabaseプロジェクトが作成されている
- [ ] 接続プーリング用URL（ポート6543）を取得している
- [ ] Prismaスキーマが正しく設定されている
- [ ] `lib/prisma.ts` がシングルトンパターンで実装されている
- [ ] `package.json` のビルドスクリプトに `prisma generate` が含まれている
- [ ] ローカル環境で `prisma generate` が正常に動作する
- [ ] ローカル環境でデータベース接続が正常に動作する
- [ ] Vercelの環境変数が正しく設定されている
- [ ] `DATABASE_URL` が接続プーリング用（ポート6543）である
- [ ] `NEXTAUTH_URL` が本番環境のURLに設定されている
- [ ] データベースマイグレーションが実行されている
- [ ] デプロイ後の動作確認が完了している

---

**最終更新日:** 2025年1月17日

